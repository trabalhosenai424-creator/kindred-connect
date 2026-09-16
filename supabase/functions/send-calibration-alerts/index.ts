import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function dayDiff(date: string) {
  const due = new Date(`${date}T00:00:00Z`).getTime();
  const today = new Date(`${isoToday()}T00:00:00Z`).getTime();
  return Math.round((due - today) / 86400000);
}

function alertText(days: number) {
  if (days < 0) return `${Math.abs(days)} dia(s) vencido.`;
  if (days === 0) return "A calibração vence hoje.";
  return `A calibração vence em ${days} dia(s).`;
}

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:instrumentacao@astrafoods.com.br";
    if (!vapidPublic || !vapidPrivate) {
      return new Response(JSON.stringify({ error: "VAPID keys are not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const { data: instruments, error: instrumentsError } = await supabase
      .from("instruments")
      .select("id, code, name, sector, next_calibration")
      .not("next_calibration", "is", null);
    if (instrumentsError) throw instrumentsError;

    const { data: users, error: usersError } = await supabase
      .from("alert_preferences")
      .select("user_id, days_before, push_enabled")
      .eq("push_enabled", true);
    if (usersError) throw usersError;

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users || []) {
      const daysBefore = Array.isArray(user.days_before) ? user.days_before.map(Number) : [30, 15, 7, 1];
      const { data: subscriptions } = await supabase
        .from("notification_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", user.user_id);

      for (const instrument of instruments || []) {
        const days = dayDiff(instrument.next_calibration);
        const shouldNotify = days <= 0 || daysBefore.includes(days);
        if (!shouldNotify) continue;

        const trigger = days <= 0 ? `overdue:${days}` : `before:${days}`;
        const dedupeKey = `${user.user_id}:${instrument.id}:${instrument.next_calibration}:${trigger}`;

        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("dedupe_key", dedupeKey)
          .maybeSingle();
        if (existing) {
          skipped++;
          continue;
        }

        const title = days < 0 ? "🔴 Instrumento vencido" : days === 0 ? "⚠️ Calibração vence hoje" : "🟡 Calibração próxima";
        const message = `${instrument.code} · ${instrument.name}: ${alertText(days)}`;

        const { data: notification, error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: user.user_id,
            instrument_id: instrument.id,
            type: days < 0 ? "calibracao_vencida" : "calibracao_proxima",
            title,
            message,
            due_date: instrument.next_calibration,
            sent_at: null,
            dedupe_key: dedupeKey,
          })
          .select("id")
          .single();
        if (notificationError) {
          if (notificationError.code === "23505") { skipped++; continue; }
          failed++;
          continue;
        }

        for (const subscription of subscriptions || []) {
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth },
              },
              JSON.stringify({
                title,
                body: message,
                icon: "/favicon.ico",
                badge: "/favicon.ico",
                tag: `calibracao-${instrument.id}`,
                url: "/?module=Alertas",
                notificationId: notification.id,
              }),
              { TTL: 86400 },
            );
            sent++;
          } catch (pushError) {
            const status = (pushError as { statusCode?: number })?.statusCode;
            if (status === 404 || status === 410) {
              await supabase.from("notification_subscriptions").delete().eq("id", subscription.id);
            }
            failed++;
          }
        }

        await supabase.from("notifications").update({ sent_at: new Date().toISOString() }).eq("id", notification.id);
      }
    }

    return new Response(JSON.stringify({ ok: true, date: isoToday(), sent, skipped, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
