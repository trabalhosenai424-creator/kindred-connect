import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = import.meta.env["VITE_VAPID_PUBLIC_KEY"] as string | undefined;

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export async function registerPushServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function subscribeCurrentUserToPush() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Este navegador não oferece Web Push.");
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("VITE_VAPID_PUBLIC_KEY não está configurada no ambiente do Lovable.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) throw new Error("Faça login para ativar as notificações.");

  const registration = await registerPushServiceWorker();
  if (!registration) throw new Error("Não foi possível registrar o Service Worker.");

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();
  if (permission !== "granted") throw new Error("A permissão de notificações foi recusada.");

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.["p256dh"];
  const auth = json.keys?.["auth"];
  if (!endpoint || !p256dh || !auth) throw new Error("O navegador não retornou uma assinatura Web Push válida.");

  const { error } = await (supabase as any)
    .from("notification_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
      },
      { onConflict: "endpoint" },
    );

  if (error) throw error;
  return subscription;
}

export async function ensurePushSubscription() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  await registerPushServiceWorker();
  if (!VAPID_PUBLIC_KEY) return;

  const sync = async () => {
    if (Notification.permission !== "granted") return;
    try {
      await subscribeCurrentUserToPush();
    } catch (error) {
      console.warn("[Push] assinatura não sincronizada:", error);
    }
  };

  await sync();
  // The existing Alertas screen requests browser permission. Poll briefly so
  // granting that permission immediately creates the Web Push subscription.
  const timer = window.setInterval(() => void sync(), 2000);
  window.setTimeout(() => window.clearInterval(timer), 120000);
}
