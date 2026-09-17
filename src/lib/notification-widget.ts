import { supabase } from "@/integrations/supabase/client";

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  due_date?: string | null;
};

const READ_KEY = "astra-instrumentacao-read-notifications";
const MAX_ITEMS = 50;

function readIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-200)));
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function typeClass(type: string) {
  if (type.includes("overdue") || type.includes("expired")) return "red";
  if (type.includes("due") || type.includes("deadline")) return "amber";
  return "blue";
}

export function installNotificationBell() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (document.getElementById("astra-notification-bell")) return;

  const style = document.createElement("style");
  style.textContent = `
    #astra-notification-bell{position:fixed;right:24px;top:14px;z-index:80;font-family:inherit}
    #astra-notification-bell button{font:inherit}
    .astra-nb-trigger{width:40px;height:40px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(15,23,42,.9);color:#94a3b8;display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(12px);box-shadow:0 8px 24px rgba(0,0,0,.25)}
    .astra-nb-trigger:hover{color:#fff;background:#172033}
    .astra-nb-badge{position:absolute;right:-3px;top:-3px;min-width:17px;height:17px;padding:0 4px;border-radius:99px;background:#2563eb;color:#fff;font:700 10px/17px system-ui;text-align:center;border:2px solid #0f172a}
    .astra-nb-panel{display:none;position:absolute;right:0;top:48px;width:360px;max-height:520px;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:#0f172a;box-shadow:0 24px 60px rgba(0,0,0,.45)}
    .astra-nb-panel.open{display:block}
    .astra-nb-head{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid rgba(255,255,255,.08)}
    .astra-nb-title{color:#f8fafc;font-size:14px;font-weight:700}.astra-nb-count{color:#64748b;font-size:11px}
    .astra-nb-clear{border:0;background:none;color:#60a5fa;font-size:11px;cursor:pointer}
    .astra-nb-list{max-height:430px;overflow:auto}.astra-nb-empty{padding:48px 20px;text-align:center;color:#64748b;font-size:13px}
    .astra-nb-item{display:block;width:100%;border:0;border-bottom:1px solid rgba(255,255,255,.06);background:transparent;text-align:left;padding:14px 16px;color:#e2e8f0;cursor:pointer}.astra-nb-item:hover{background:rgba(255,255,255,.04)}
    .astra-nb-item.unread{background:rgba(37,99,235,.06)}
    .astra-nb-row{display:flex;gap:10px}.astra-nb-dot{width:8px;height:8px;border-radius:50%;margin-top:5px;flex:none}.astra-nb-dot.blue{background:#3b82f6}.astra-nb-dot.amber{background:#f59e0b}.astra-nb-dot.red{background:#ef4444}
    .astra-nb-content{min-width:0}.astra-nb-item-title{font-size:13px;font-weight:600}.astra-nb-message{margin-top:3px;color:#94a3b8;font-size:11px;line-height:1.45}.astra-nb-time{margin-top:6px;color:#475569;font-size:10px}
    @media(max-width:640px){#astra-notification-bell{right:14px}.astra-nb-panel{position:fixed;right:12px;top:60px;width:min(360px,calc(100vw - 24px))}}
  `;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "astra-notification-bell";
  root.innerHTML = `
    <button class="astra-nb-trigger" aria-label="Abrir notificações" title="Notificações">
      <span aria-hidden="true">🔔</span><span class="astra-nb-badge" style="display:none">0</span>
    </button>
    <div class="astra-nb-panel">
      <div class="astra-nb-head"><div><div class="astra-nb-title">Notificações</div><div class="astra-nb-count">Carregando...</div></div><button class="astra-nb-clear">Marcar todas como lidas</button></div>
      <div class="astra-nb-list"><div class="astra-nb-empty">Carregando alertas...</div></div>
    </div>`;
  document.body.appendChild(root);

  const trigger = root.querySelector<HTMLButtonElement>(".astra-nb-trigger")!;
  const panel = root.querySelector<HTMLDivElement>(".astra-nb-panel")!;
  const badge = root.querySelector<HTMLSpanElement>(".astra-nb-badge")!;
  const count = root.querySelector<HTMLDivElement>(".astra-nb-count")!;
  const list = root.querySelector<HTMLDivElement>(".astra-nb-list")!;
  const clear = root.querySelector<HTMLButtonElement>(".astra-nb-clear")!;
  let items: NotificationRow[] = [];

  const render = () => {
    const ids = readIds();
    const unread = items.filter((x) => !ids.has(x.id)).length;
    badge.textContent = unread > 99 ? "99+" : String(unread);
    badge.style.display = unread ? "block" : "none";
    count.textContent = unread ? `${unread} não lida${unread === 1 ? "" : "s"}` : "Tudo em dia";
    clear.style.display = items.length ? "block" : "none";
    if (!items.length) {
      list.innerHTML = `<div class="astra-nb-empty">Nenhum alerta registrado.</div>`;
      return;
    }
    list.innerHTML = items.map((item) => {
      const unreadClass = ids.has(item.id) ? "" : "unread";
      const cls = typeClass(item.type);
      return `<button class="astra-nb-item ${unreadClass}" data-id="${item.id}"><div class="astra-nb-row"><span class="astra-nb-dot ${cls}"></span><div class="astra-nb-content"><div class="astra-nb-item-title">${escapeHtml(item.title)}</div><div class="astra-nb-message">${escapeHtml(item.message)}</div><div class="astra-nb-time">${formatDate(item.created_at)}</div></div></div></button>`;
    }).join("");
  };

  const markRead = (id: string) => {
    const ids = readIds(); ids.add(id); persistReadIds(ids); render();
  };

  list.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-id]");
    if (target?.dataset.id) markRead(target.dataset.id);
  });
  clear.addEventListener("click", () => { const ids = readIds(); items.forEach((x) => ids.add(x.id)); persistReadIds(ids); render(); });
  trigger.addEventListener("click", () => panel.classList.toggle("open"));
  document.addEventListener("click", (event) => { if (!root.contains(event.target as Node)) panel.classList.remove("open"); });

  const load = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { count.textContent = "Entre para ver alertas"; list.innerHTML = `<div class="astra-nb-empty">Faça login para receber notificações.</div>`; return; }
      const { data, error } = await (supabase as any).from("notifications").select("id,title,message,type,created_at,due_date").order("created_at", { ascending: false }).limit(MAX_ITEMS);
      if (error) throw error;
      items = (data || []) as NotificationRow[];
      render();
      supabase.channel(`astra-notifications-${auth.user.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${auth.user.id}` }, (payload) => {
        items = [payload.new as NotificationRow, ...items].slice(0, MAX_ITEMS);
        render();
      }).subscribe();
    } catch (error) {
      console.warn("[Notifications] não foi possível carregar:", error);
      count.textContent = "Alertas indisponíveis";
      list.innerHTML = `<div class="astra-nb-empty">Não foi possível carregar os alertas agora.</div>`;
    }
  };

  const escapeHtml = (value: string) => value.replace(/[&<>\"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#039;" }[char] || char));
  void load();
}
