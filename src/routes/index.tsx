import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import {
  Activity, AlertTriangle, BarChart3, Bell, Boxes, CalendarDays, CalendarClock,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, Download,
  FileText, Gauge, History, LayoutDashboard, Loader2, LogOut, Menu, Plus, Search,
  Settings, ShieldCheck, Trash2, Wrench, X
} from "lucide-react";
import {
  listInstruments, createInstrument, updateInstrument, deleteInstrument,
  listCalibrations, createCalibration,
  type CloudInstrument, type CloudCalibration,
} from "@/lib/instrumentacao-data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Instrumentação — Astra Foods" },
    { name: "description", content: "Sistema de gestão de instrumentação, calibração e metrologia da Astra Foods." },
  ]}),
  component: Index,
});

type RecordItem = { id: number; title: string; status: string; date: string; detail: string };
type Module = "Dashboard" | "Agenda" | "Instrumentos" | "Calibração" | "Manutenção" | "Movimentações" | "Padrões" | "Certificados" | "Não Conformidades" | "Alertas" | "Indicadores" | "Relatórios" | "Documentos" | "Configurações";

type Group = { title: string; items: [Module, typeof LayoutDashboard][] };
const groups: Group[] = [
  { title: "PRINCIPAL", items: [["Dashboard", LayoutDashboard], ["Agenda", CalendarDays], ["Alertas", Bell]] },
  { title: "GESTÃO", items: [["Instrumentos", Gauge], ["Calibração", ClipboardCheck], ["Manutenção", Wrench], ["Movimentações", History]] },
  { title: "METROLOGIA", items: [["Padrões", ShieldCheck], ["Certificados", FileText]] },
  { title: "QUALIDADE", items: [["Não Conformidades", AlertTriangle]] },
  { title: "ANÁLISES", items: [["Indicadores", BarChart3], ["Relatórios", Activity]] },
  { title: "ARQUIVOS", items: [["Documentos", FileText]] },
];
const today = new Date();
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const dateBR = (s: string | null) => s ? new Date(`${s}T12:00:00`).toLocaleDateString("pt-BR") : "—";
const daysFromNow = (s: string | null) => s ? Math.ceil((new Date(`${s}T12:00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000) : 999;

function Index() {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      supabase.auth.getSession().then(({ data }) => setSession(!!data.session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === null) return <AuthScreen />;
  return <FullScreen><AppShell /></FullScreen>;
}

function FullScreen({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
}

function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo(""); setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) setInfo("Cadastro criado! Confirme o e-mail clicando no link que enviamos antes de entrar.");
        else setInfo("Conta criada! Entrando...");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(""); setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res && "error" in res && res.error) setError(res.error instanceof Error ? res.error.message : "Falha no login com Google.");
    if (!(res && "redirected" in res && res.redirected)) setBusy(false);
  };

  return <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[.03] p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600"><Gauge className="h-5 w-5"/></div>
        <div><div className="font-semibold tracking-tight">INSTRUMENTAÇÃO</div><div className="text-xs text-slate-500">Astra Foods</div></div>
      </div>
      <h1 className="text-lg font-semibold">{mode === "signin" ? "Entrar no sistema" : "Criar conta"}</h1>
      <p className="mt-1 text-sm text-slate-500">Acesse com sua conta para gerenciar instrumentos e calibrações.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <label className="block text-xs text-slate-500">E-mail
          <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-violet-500/60"/>
        </label>
        <label className="block text-xs text-slate-500">Senha
          <input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-violet-500/60"/>
        </label>
        {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
        {info && <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{info}</p>}
        <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium hover:bg-violet-500 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin"/>}{mode === "signin" ? "Entrar" : "Criar conta"}
        </button>
      </form>
      <button onClick={google} disabled={busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm hover:bg-white/5 disabled:opacity-60">
        <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.3c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.6 1.7 15 0.6 12 0.6 7.4 0.6 3.4 3.2 1.5 7l3.9 3C6.3 7.2 8.9 5.3 12 5.3z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.8 2.9c2.2-2 3.6-5 3.6-8.8z"/><path fill="#FBBC05" d="M5.4 14.1a7 7 0 0 1 0-4.2l-3.9-3a11.6 11.6 0 0 0 0 10.2l3.9-3z"/><path fill="#34A853" d="M12 23.4c3 0 5.6-1 7.5-2.7l-3.8-2.9c-1 .7-2.3 1.1-3.7 1.1-3.1 0-5.7-1.9-6.6-4.7l-3.9 3c1.9 3.7 5.9 6.2 10.5 6.2z"/></svg>
        Continuar com Google
      </button>
      <button onClick={()=>{setMode(m=>m==="signin"?"signup":"signin");setError("");setInfo("");}} className="mt-5 w-full text-center text-xs text-slate-500 hover:text-slate-300">
        {mode === "signin" ? "Não tem conta? Criar uma agora" : "Já tem conta? Entrar"}
      </button>
    </div>
  </div>;
}

function AppShell() {
  const [active, setActive] = useState<Module>("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState<Record<string, boolean>>({ PRINCIPAL:true, GESTÃO:true, METROLOGIA:true, QUALIDADE:true, ANÁLISES:true, ARQUIVOS:true });
  const [instruments, setInstruments] = useState<CloudInstrument[]>([]);
  const [calibrations, setCalibrations] = useState<CloudCalibration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloudError, setCloudError] = useState("");
  const [maintenance, setMaintenance] = useState<RecordItem[]>([]);
  const [movements, setMovements] = useState<RecordItem[]>([]);
  const [standards, setStandards] = useState<RecordItem[]>([]);
  const [certificates, setCertificates] = useState<RecordItem[]>([]);
  const [ncs, setNcs] = useState<RecordItem[]>([]);
  const [documents, setDocuments] = useState<RecordItem[]>([]);
  const [search, setSearch] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const reload = useCallback(async () => {
    setCloudError("");
    try {
      const [inst, calib] = await Promise.all([listInstruments(), listCalibrations()]);
      setInstruments(inst);
      setCalibrations(calib);
    } catch (err) {
      setCloudError(err instanceof Error ? err.message : "Falha ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ""));
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  const overdue = instruments.filter(x => x.next_calibration && daysFromNow(x.next_calibration) < 0).length;
  const dueSoon = instruments.filter(x => x.next_calibration && daysFromNow(x.next_calibration) >= 0 && daysFromNow(x.next_calibration) <= 30).length;
  const activeAlerts = overdue + instruments.filter(x => x.next_calibration && daysFromNow(x.next_calibration) >= 0 && daysFromNow(x.next_calibration) <= 7).length + ncs.filter(x => x.status !== "Concluída").length;
  const navigate = (m: Module) => { setActive(m); setMobileOpen(false); };

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <button className="fixed left-4 top-4 z-40 rounded-lg border border-white/10 bg-slate-900 p-2 lg:hidden" onClick={() => setMobileOpen(v=>!v)}><Menu className="h-5 w-5"/></button>
    <aside className={`fixed inset-y-0 left-0 z-30 border-r border-white/10 bg-slate-950 transition-all ${collapsed ? "w-[76px]" : "w-64"} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="flex h-full flex-col px-3 py-5">
        <div className={`mb-5 flex items-center gap-3 px-2 ${collapsed ? "justify-center" : ""}`}><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600"><Gauge className="h-5 w-5"/></div>{!collapsed && <div><div className="font-semibold tracking-tight">INSTRUMENTAÇÃO</div><div className="text-xs text-slate-500">Astra Foods</div></div>}</div>
        <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {groups.map(g => <div key={g.title}>{!collapsed && <button onClick={()=>setGroupsOpen(v=>({...v,[g.title]:!v[g.title]}))} className="mb-1 flex w-full items-center justify-between px-3 py-1 text-[10px] font-semibold tracking-[.14em] text-slate-600"><span>{g.title}</span><ChevronDown className={`h-3 w-3 ${groupsOpen[g.title]?"":"-rotate-90"}`}/></button>}{(collapsed || groupsOpen[g.title]) && <div className="space-y-0.5">{g.items.map(([label,Icon])=><button key={label} title={collapsed?label:undefined} onClick={()=>navigate(label)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${active===label?"bg-violet-600/15 text-white":"text-slate-400 hover:bg-white/5 hover:text-white"} ${collapsed?"justify-center":""}`}><Icon className={`h-4 w-4 shrink-0 ${active===label?"text-violet-400":""}`}/>{!collapsed&&<span>{label}</span>}</button>)}</div>}</div>)}
        </nav>
        <div className="mt-3 space-y-1 border-t border-white/10 pt-3">
          <button onClick={()=>navigate("Configurações")} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active==="Configurações"?"bg-violet-600/15 text-white":"text-slate-400 hover:bg-white/5 hover:text-white"} ${collapsed?"justify-center":""}`}><Settings className="h-4 w-4"/>{!collapsed&&"Configurações"}</button>
          <button onClick={signOut} title="Sair" className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white ${collapsed?"justify-center":""}`}><LogOut className="h-4 w-4"/>{!collapsed&&"Sair"}</button>
          <button onClick={()=>setCollapsed(v=>!v)} className={`hidden w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 hover:bg-white/5 hover:text-white lg:flex ${collapsed?"justify-center":""}`}>{collapsed?<ChevronRight className="h-4 w-4"/>:<><ChevronLeft className="h-4 w-4"/>Recolher menu</>}</button>
        </div>
      </div>
    </aside>
    <main className={`transition-all ${collapsed?"lg:pl-[76px]":"lg:pl-64"}`}>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-6 py-4 backdrop-blur-xl lg:px-8"><div className="flex items-center justify-between pl-10 lg:pl-0"><div><p className="text-xs text-slate-500">Instrumentação / {active}</p><h1 className="mt-0.5 text-xl font-semibold">{active}</h1></div><div className="hidden items-center gap-3 text-xs text-slate-400 sm:flex"><span className="max-w-48 truncate">{userEmail}</span><span className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"><CalendarClock className="h-4 w-4"/>{today.toLocaleDateString("pt-BR")}</span></div></div></header>
      <section className="p-5 lg:p-8">
        {cloudError && <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{cloudError} <button onClick={()=>void reload()} className="ml-2 underline">Tentar de novo</button></div>}
        {loading ? <div className="flex items-center gap-2 py-16 text-slate-500"><Loader2 className="h-5 w-5 animate-spin"/>Carregando dados...</div> : <>
          {active==="Dashboard"&&<Dashboard instruments={instruments} calibrations={calibrations} overdue={overdue} dueSoon={dueSoon} alerts={activeAlerts} navigate={navigate}/>}
          {active==="Agenda"&&<Agenda instruments={instruments} calibrations={calibrations} navigate={navigate}/>}
          {active==="Instrumentos"&&<Instrumentos data={instruments} reload={reload} search={search} setSearch={setSearch}/>}
          {active==="Calibração"&&<Calibracoes instruments={instruments} data={calibrations} reload={reload}/>}
          {active==="Manutenção"&&<GenericModule title="Manutenção" description="Abra, acompanhe e conclua intervenções nos instrumentos." data={maintenance} setData={setMaintenance} action="Nova manutenção" fields={["Instrumento","Tipo de manutenção","Responsável"]}/>}
          {active==="Movimentações"&&<GenericModule title="Movimentações" description="Registre transferências entre setores, locais e responsáveis." data={movements} setData={setMovements} action="Nova movimentação" fields={["Instrumento","Origem → Destino","Responsável"]}/>}
          {active==="Padrões"&&<GenericModule title="Padrões" description="Controle padrões, rastreabilidade e validade metrológica." data={standards} setData={setStandards} action="Novo padrão" fields={["Código do padrão","Descrição","Validade"]}/>}
          {active==="Certificados"&&<GenericModule title="Certificados" description="Controle certificados e suas datas de validade." data={certificates} setData={setCertificates} action="Novo certificado" fields={["Número do certificado","Instrumento/Padrão","Validade"]}/>}
          {active==="Não Conformidades"&&<GenericModule title="Não Conformidades" description="Registre ocorrências, ações corretivas, responsáveis e encerramento." data={ncs} setData={setNcs} action="Nova NC" fields={["Título da NC","Origem","Responsável"]} statuses={["Aberta","Em tratamento","Concluída"]}/>}
          {active==="Alertas"&&<Alerts instruments={instruments} ncs={ncs}/>}
          {active==="Indicadores"&&<Indicators instruments={instruments} calibrations={calibrations} overdue={overdue} dueSoon={dueSoon}/>}
          {active==="Relatórios"&&<Reports instruments={instruments} calibrations={calibrations}/>}
          {active==="Documentos"&&<GenericModule title="Documentos" description="Organize procedimentos, certificados, registros e documentos do setor." data={documents} setData={setDocuments} action="Novo documento" fields={["Nome do documento","Categoria","Responsável"]}/>}
          {active==="Configurações"&&<SettingsPage/>}
        </>}
      </section>
    </main>
  </div>;
}

function Dashboard({instruments,calibrations,overdue,dueSoon,alerts,navigate}:{instruments:CloudInstrument[];calibrations:CloudCalibration[];overdue:number;dueSoon:number;alerts:number;navigate:(m:Module)=>void}){return <div className="space-y-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-semibold">Visão geral</h2><p className="mt-1 text-sm text-slate-500">Controle do parque metrológico e das próximas validades.</p></div><button onClick={()=>navigate("Agenda")} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500"><CalendarDays className="h-4 w-4"/>Abrir agenda</button></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={Boxes} label="Instrumentos" value={instruments.length} detail="cadastrados"/><Stat icon={CalendarClock} label="Próximos 30 dias" value={dueSoon} detail="calibrações"/><Stat icon={AlertTriangle} label="Vencidos" value={overdue} detail="requerem atenção"/><Stat icon={Bell} label="Alertas" value={alerts} detail="ativos"/></div><section className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Próximas calibrações</h2><p className="mt-1 text-sm text-slate-500">Agenda dos instrumentos cadastrados.</p></div><button onClick={()=>navigate("Calibração")} className="text-xs text-violet-400">Registrar calibração</button></div><div className="mt-5 space-y-2">{instruments.filter((x)=>x.next_calibration).sort((a,b)=>(a.next_calibration??"").localeCompare(b.next_calibration??"")).slice(0,5).map((x)=><DueRow key={x.id} instrument={x.code+" · "+x.name} date={x.next_calibration}/>)}</div>{!instruments.length&&<Empty text="Cadastre um instrumento para começar a controlar vencimentos."/>}</section><section className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><h2 className="font-semibold">Últimas calibrações</h2>{calibrations.length?<div className="mt-4 space-y-2">{[...calibrations].reverse().slice(0,5).map((x)=><div key={x.id} className="flex items-center justify-between rounded-xl border border-white/5 px-4 py-3"><div><span className="text-sm font-medium">{x.instrument_label}</span><p className="text-xs text-slate-500">{dateBR(x.calibration_date)} · {x.technician||"Sem responsável"}</p></div><span className={`rounded-full px-2.5 py-1 text-xs ${x.result==="Aprovado"?"bg-emerald-500/10 text-emerald-400":"bg-red-500/10 text-red-400"}`}>{x.result}</span></div>)}</div>:<Empty text="Nenhuma calibração registrada."/>}</section></div>}

function Agenda({instruments,calibrations,navigate}:{instruments:CloudInstrument[];calibrations:CloudCalibration[];navigate:(m:Module)=>void}){const [month,setMonth]=useState(new Date(today.getFullYear(),today.getMonth(),1));const [selected,setSelected]=useState(iso(today));const events=useMemo(()=>{const m=new Map<string,{type:string;title:string;detail:string}[]>();instruments.forEach((x)=>{if(x.next_calibration){const a=m.get(x.next_calibration)||[];a.push({type:"Calibração",title:x.code+" · "+x.name,detail:x.sector||""});m.set(x.next_calibration,a);}});calibrations.forEach((x)=>{if(x.next_date){const a=m.get(x.next_date)||[];a.push({type:"Registro",title:x.instrument_label,detail:"Próxima calibração"});m.set(x.next_date,a);}});return m},[instruments,calibrations]);const first=new Date(month.getFullYear(),month.getMonth(),1);const start=new Date(first);start.setDate(1-first.getDay());const cells=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d});const selectedEvents=events.get(selected)||[];return <div className="space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-semibold">Agenda metrológica</h2><p className="mt-1 text-sm text-slate-500">Visualize vencimentos e planeje as calibrações.</p></div><div className="flex gap-2"><button onClick={()=>setMonth(new Date(today.getFullYear(),today.getMonth(),1))} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Hoje</button><button onClick={()=>navigate("Calibração")} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium"><Plus className="h-4 w-4"/>Nova calibração</button></div></div><div className="grid gap-6 xl:grid-cols-[1fr_320px]"><section className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="mb-5 flex items-center justify-between"><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))} className="rounded-lg border border-white/10 p-2"><ChevronLeft className="h-4 w-4"/></button><h3 className="font-semibold capitalize">{month.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</h3><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))} className="rounded-lg border border-white/10 p-2"><ChevronRight className="h-4 w-4"/></button></div><div className="grid grid-cols-7 border-l border-t border-white/10">{["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d=><div key={d} className="border-b border-r border-white/10 p-2 text-center text-[10px] font-semibold uppercase text-slate-600">{d}</div>)}{cells.map(d=>{const key=iso(d), list=events.get(key)||[], same=d.getMonth()===month.getMonth(), isToday=key===iso(today), selectedDay=key===selected;return <button key={key} onClick={()=>setSelected(key)} className={`min-h-24 border-b border-r border-white/10 p-2 text-left align-top ${same?"bg-white/[.01]":"bg-black/10 text-slate-700"} ${selectedDay?"ring-1 ring-inset ring-violet-500/70":""}`}><div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday?"bg-violet-600 text-white":""}`}>{d.getDate()}</div>{list.slice(0,2).map((e,i)=><div key={i} className={`mb-1 truncate rounded px-1.5 py-1 text-[10px] ${daysFromNow(key)<0?"bg-red-500/10 text-red-400":"bg-violet-500/10 text-violet-300"}`}>{e.title}</div>)}{list.length>2&&<div className="text-[10px] text-slate-600">+{list.length-2} mais</div>}</button>})}</div></section><section className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><p className="text-xs uppercase tracking-wider text-slate-600">Selecionado</p><h3 className="mt-1 text-lg font-semibold">{dateBR(selected)}</h3><div className="mt-5 space-y-3">{selectedEvents.length?selectedEvents.map((e,i)=><div key={i} className="rounded-xl border border-white/10 bg-black/10 p-4"><div className="text-xs text-violet-400">{e.type}</div><div className="mt-1 text-sm font-medium">{e.title}</div><div className="mt-1 text-xs text-slate-500">{e.detail}</div></div>):<p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-600">Nenhum evento nesta data.</p>}</div></section></div></div>}

function Instrumentos({data,reload,search,setSearch}:{data:CloudInstrument[];reload:()=>Promise<void>;search:string;setSearch:(v:string)=>void}){
  const [form,setForm]=useState(false);
  const [draft,setDraft]=useState<Partial<CloudInstrument>>({code:"",name:"",sector:"",status:"Ativo",next_calibration:null});
  const [busy,setBusy]=useState(false);
  const save=async()=>{
    if(!draft.code?.trim()||!draft.name?.trim()||busy)return;
    setBusy(true);
    try{
      const payload={code:draft.code!.trim(),name:draft.name!.trim(),sector:draft.sector||null,status:(draft.status??"Ativo") as CloudInstrument["status"],next_calibration:draft.next_calibration||null};
      if(draft.id) await updateInstrument(draft.id,payload);
      else await createInstrument(payload);
      setForm(false);setDraft({code:"",name:"",sector:"",status:"Ativo",next_calibration:null});
      await reload();
    }catch(err){alert(err instanceof Error?err.message:"Falha ao salvar instrumento.");}
    finally{setBusy(false);}
  };
  const remove=async(id:string)=>{
    if(!confirm("Excluir este instrumento?"))return;
    try{await deleteInstrument(id);await reload();}
    catch(err){alert(err instanceof Error?err.message:"Falha ao excluir instrumento.");}
  };
  const filtered=data.filter((x)=>`${x.code} ${x.name} ${x.sector??""}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-semibold">Instrumentos</h2><p className="mt-1 text-sm text-slate-500">Cadastro e controle das próximas calibrações — salvo no banco.</p></div><button onClick={()=>{setDraft({code:"",name:"",sector:"",status:"Ativo",next_calibration:null});setForm(true)}} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium"><Plus className="h-4 w-4"/>Novo instrumento</button></div><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2"><Search className="h-4 w-4 text-slate-500"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar código, instrumento ou setor..." className="w-full bg-transparent text-sm outline-none"/></div>{form&&<Modal title={draft.id?"Editar instrumento":"Novo instrumento"} close={()=>setForm(false)}><div className="grid gap-3 sm:grid-cols-2">{([["code","Código"],["name","Instrumento"],["sector","Setor"]] as const).map(([k,l])=><label key={k} className="text-xs text-slate-500">{l}<input value={(draft[k] as string)||""} onChange={e=>setDraft({...draft,[k]:e.target.value})} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"/></label>)}<label className="text-xs text-slate-500">Status<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as CloudInstrument["status"]})} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"><option>Ativo</option><option>Manutenção</option><option>Inativo</option></select></label><label className="text-xs text-slate-500">Próxima calibração<input type="date" value={draft.next_calibration||""} onChange={e=>setDraft({...draft,next_calibration:e.target.value||null})} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"/></label></div><div className="mt-5 flex justify-end gap-2"><button onClick={()=>setForm(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm">Cancelar</button><button onClick={save} disabled={busy} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium disabled:opacity-60">{busy?"Salvando...":"Salvar"}</button></div></Modal>}<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]"><div className="border-b border-white/10 px-5 py-4 text-sm text-slate-500">{filtered.length} instrumento(s)</div>{filtered.length?filtered.map((x)=><div key={x.id} className="flex flex-col gap-3 border-b border-white/5 px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-medium">{x.code} · {x.name}</div><div className="text-xs text-slate-500">{x.sector||"Sem setor"} · Próxima: {dateBR(x.next_calibration)}</div></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs ${x.status==="Ativo"?"bg-emerald-500/10 text-emerald-400":x.status==="Manutenção"?"bg-amber-500/10 text-amber-400":"bg-slate-500/10 text-slate-400"}`}>{x.status}</span><button onClick={()=>{setDraft(x);setForm(true)}} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs">Editar</button><button onClick={()=>remove(x.id)} className="rounded-lg border border-red-500/10 p-2 text-red-400"><Trash2 className="h-3.5 w-3.5"/></button></div></div>):<Empty text="Nenhum instrumento cadastrado."/>}</div></div>;
}

function Calibracoes({instruments,data,reload}:{instruments:CloudInstrument[];data:CloudCalibration[];reload:()=>Promise<void>;}){
  const [form,setForm]=useState(false);
  const [busy,setBusy]=useState(false);
  const [d,setD]=useState<{instrument_id:string;calibration_date:string;result:CloudCalibration["result"];next_date:string|null;technician:string}>({instrument_id:"",calibration_date:iso(today),result:"Aprovado",next_date:null,technician:""});
  const save=async()=>{
    if(!d.instrument_id||!d.calibration_date||busy)return;
    setBusy(true);
    try{
      await createCalibration({instrument_id:d.instrument_id,instrument_label:labelOf(d.instrument_id),calibration_date:d.calibration_date,result:d.result,next_date:d.next_date,technician:d.technician||null});
      if(d.next_date) await updateInstrument(d.instrument_id,{next_calibration:d.next_date});
      setForm(false);setD({instrument_id:"",calibration_date:iso(today),result:"Aprovado",next_date:null,technician:""});
      await reload();
    }catch(err){alert(err instanceof Error?err.message:"Falha ao registrar calibração.");}
    finally{setBusy(false);}
  };
  const labelOf=(id:string)=>{const x=instruments.find(i=>i.id===id);return x?`${x.code} · ${x.name}`:"Instrumento";};
  return <div className="space-y-5"><div className="flex items-end justify-between"><div><h2 className="text-2xl font-semibold">Calibração</h2><p className="mt-1 text-sm text-slate-500">Registre resultados e gere a próxima data de vencimento — salvo no banco.</p></div><button onClick={()=>setForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm"><Plus className="h-4 w-4"/>Registrar</button></div>{form&&<Modal title="Registrar calibração" close={()=>setForm(false)}><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-500 sm:col-span-2">Instrumento<select value={d.instrument_id} onChange={e=>setD({...d,instrument_id:e.target.value})} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"><option value="">Selecione...</option>{instruments.map((x)=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select></label><label className="text-xs text-slate-500">Data<input type="date" value={d.calibration_date} onChange={e=>setD({...d,calibration_date:e.target.value})} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"/></label><label className="text-xs text-slate-500">Próxima calibração<input type="date" value={d.next_date||""} onChange={e=>setD({...d,next_date:e.target.value||null})} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"/></label><label className="text-xs text-slate-500">Resultado<select value={d.result} onChange={e=>setD({...d,result:e.target.value as CloudCalibration["result"]})} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"><option>Aprovado</option><option>Reprovado</option></select></label><label className="text-xs text-slate-500">Técnico<input value={d.technician} onChange={e=>setD({...d,technician:e.target.value})} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"/></label></div><div className="mt-5 flex justify-end gap-2"><button onClick={()=>setForm(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm">Cancelar</button><button onClick={save} disabled={busy} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium disabled:opacity-60">{busy?"Salvando...":"Salvar"}</button></div></Modal>}<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">{data.length?data.map((x)=><div key={x.id} className="flex flex-col gap-2 border-b border-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-medium">{x.instrument_label}</div><div className="text-xs text-slate-500">Realizada {dateBR(x.calibration_date)} · Próxima {dateBR(x.next_date)} · {x.technician||"Sem técnico"}</div></div><span className={`rounded-full px-2.5 py-1 text-xs ${x.result==="Aprovado"?"bg-emerald-500/10 text-emerald-400":"bg-red-500/10 text-red-400"}`}>{x.result}</span></div>):<Empty text="Nenhuma calibração registrada."/>}</div></div>;
}

function Alerts({instruments,ncs}:{instruments:CloudInstrument[];ncs:RecordItem[]}){const items=instruments.filter((x)=>x.next_calibration&&daysFromNow(x.next_calibration)<=30).sort((a,b)=>(a.next_calibration??"").localeCompare(b.next_calibration??""));return <div className="space-y-5"><div><h2 className="text-2xl font-semibold">Central de alertas</h2><p className="mt-1 text-sm text-slate-500">Tudo que precisa de atenção antes ou depois do vencimento.</p></div><div className="grid gap-3">{items.map((x)=>{const days=daysFromNow(x.next_calibration);return <div key={x.id} className={`flex items-center justify-between rounded-2xl border p-5 ${days<0?"border-red-500/20 bg-red-500/[.04]":days<=7?"border-amber-500/20 bg-amber-500/[.04]":"border-white/10 bg-white/[.03]"}`}><div className="flex items-center gap-4"><div className="rounded-xl bg-white/5 p-3"><Bell className="h-5 w-5"/></div><div><div className="font-medium">{x.code} · {x.name}</div><div className="text-xs text-slate-500">{x.sector||"Sem setor"} · vencimento {dateBR(x.next_calibration)}</div></div></div><span className="text-sm font-semibold">{days<0?`${Math.abs(days)} dia(s) vencido`:days===0?"Vence hoje":`em ${days} dia(s)`}</span></div>})}{ncs.filter((x)=>x.status!=="Concluída").map((x)=><div key={`nc-${x.id}`} className="rounded-2xl border border-amber-500/20 bg-amber-500/[.04] p-5"><div className="font-medium">NC pendente: {x.title}</div><div className="mt-1 text-xs text-slate-500">{x.status} · {x.detail}</div></div>)}{!items.length&&!ncs.length&&<Empty text="Nenhum alerta ativo."/>}</div><NotificationCard/></div>}

function NotificationCard(){const [status,setStatus]=useState(typeof Notification!=="undefined"?Notification.permission:"default");const request=async()=>{if(typeof Notification!=="undefined")setStatus(await Notification.requestPermission())};return <section className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">Notificações no dispositivo</h3><p className="mt-1 max-w-xl text-sm text-slate-500">Permite que o navegador mostre avisos de calibrações vencidas ou próximas do vencimento.</p></div><Bell className="h-5 w-5 text-violet-400"/></div><div className="mt-5 flex items-center justify-between rounded-xl border border-white/5 bg-black/10 p-4"><div className="text-sm">Permissão: <span className="font-medium">{status==="granted"?"Ativada":status==="denied"?"Bloqueada":"Não configurada"}</span></div>{status!=="granted"&&<button onClick={request} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium">Ativar notificações</button>}</div></section>;}

function GenericModule({title,description,data,setData,action,fields,statuses=["Aberta","Concluída"]}:{title:string;description:string;data:RecordItem[];setData:React.Dispatch<React.SetStateAction<RecordItem[]>>;action:string;fields:string[];statuses?:string[]}){const [form,setForm]=useState(false);const [values,setValues]=useState<string[]>(fields.map(()=>""));const save=()=>{if(!values[0]?.trim())return;setData((old)=>[...old,{id:Date.now(),title:values[0],status:statuses[0],date:iso(today),detail:values.slice(1).filter(Boolean).join(" · ")}]);setValues(fields.map(()=>""));setForm(false)};return <div className="space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div><button onClick={()=>setForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm"><Plus className="h-4 w-4"/>{action}</button></div>{form&&<Modal title={action} close={()=>setForm(false)}><div className="space-y-3">{fields.map((f,i)=><label key={f} className="block text-xs text-slate-500">{f}<input value={values[i]||""} onChange={e=>setValues(v=>v.map((x,j)=>j===i?e.target.value:x))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"/></label>)}</div><div className="mt-5 flex justify-end gap-2"><button onClick={()=>setForm(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm">Cancelar</button><button onClick={save} className="rounded-lg bg-violet-600 px-4 py-2 text-sm">Salvar</button></div></Modal>}<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">{data.length?data.map((x)=><div key={x.id} className="flex items-center justify-between border-b border-white/5 px-5 py-4"><div><div className="text-sm font-medium">{x.title}</div><div className="text-xs text-slate-500">{x.detail} · {dateBR(x.date)}</div></div><div className="flex items-center gap-2"><span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300">{x.status}</span><button onClick={()=>setData((old)=>old.filter(i=>i.id!==x.id))} className="p-2 text-red-400"><Trash2 className="h-4 w-4"/></button></div></div>):<Empty text="Nenhum registro cadastrado."/>}</div></div>}

function Indicators({instruments,calibrations,overdue,dueSoon}:{instruments:CloudInstrument[];calibrations:CloudCalibration[];overdue:number;dueSoon:number}){const approved=calibrations.filter((x)=>x.result==="Aprovado").length;const rate=calibrations.length?Math.round(approved/calibrations.length*100):0;return <div className="space-y-5"><div><h2 className="text-2xl font-semibold">Indicadores</h2><p className="mt-1 text-sm text-slate-500">Visão rápida do desempenho metrológico.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={Boxes} label="Instrumentos" value={instruments.length} detail="total"/><Stat icon={ClipboardCheck} label="Calibrações" value={calibrations.length} detail="registradas"/><Stat icon={CheckCircle2} label="Aprovação" value={`${rate}%`} detail="dos registros"/><Stat icon={AlertTriangle} label="Risco" value={overdue+dueSoon} detail="vencidos + próximos"/></div><section className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><h3 className="font-semibold">Distribuição de prazos</h3><div className="mt-5 space-y-4"><Bar label="Em dia / >30 dias" value={Math.max(instruments.length-overdue-dueSoon,0)} total={Math.max(instruments.length,1)}/><Bar label="Próximos 30 dias" value={dueSoon} total={Math.max(instruments.length,1)}/><Bar label="Vencidos" value={overdue} total={Math.max(instruments.length,1)}/></div></section></div>}

function Reports({instruments,calibrations}:{instruments:CloudInstrument[];calibrations:CloudCalibration[]}){const exportCSV=()=>{const rows=[["Código","Instrumento","Setor","Status","Próxima calibração"],...instruments.map((x)=>[x.code,x.name,x.sector??"",x.status,x.next_calibration??""])];const csv=rows.map(r=>r.map((v: unknown)=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="relatorio-instrumentacao.csv";a.click();URL.revokeObjectURL(a.href)};return <div className="space-y-5"><div className="flex items-end justify-between"><div><h2 className="text-2xl font-semibold">Relatórios</h2><p className="mt-1 text-sm text-slate-500">Resumo do parque e histórico de calibrações.</p></div><button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm"><Download className="h-4 w-4"/>Exportar CSV</button></div><div className="grid gap-4 sm:grid-cols-2"><Stat icon={Boxes} label="Instrumentos" value={instruments.length} detail="no cadastro"/><Stat icon={ClipboardCheck} label="Calibrações" value={calibrations.length} detail="no histórico"/></div></div>}

function SettingsPage(){return <div className="space-y-5"><div><h2 className="text-2xl font-semibold">Configurações</h2><p className="mt-1 text-sm text-slate-500">Preferências para alertas e operação do sistema.</p></div><section className="rounded-2xl border border-white/10 bg-white/[.03] p-6"><h3 className="font-semibold">Política de alertas</h3><div className="mt-5 grid gap-3 sm:grid-cols-4">{[30,15,7,1].map(d=><div key={d} className="rounded-xl border border-white/10 p-4"><div className="text-2xl font-semibold">{d}</div><div className="text-xs text-slate-500">dias antes</div></div>)}</div><p className="mt-4 text-xs text-slate-600">Você receberá notificações 30, 15, 7 e 1 dia antes de cada vencimento — e novamente quando vencer.</p></section></div>}

function Modal({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}){return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="font-semibold">{title}</h3><button onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"><X className="h-4 w-4"/></button></div><div className="mt-5">{children}</div></div></div>}
function DueRow({instrument,date}:{instrument:string;date:string|null}){const days=daysFromNow(date);return <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/10 px-4 py-3"><div><div className="text-sm font-medium">{instrument}</div><div className="text-xs text-slate-500">Vencimento: {dateBR(date)}</div></div><span className={`rounded-full px-2.5 py-1 text-xs ${days<0?"bg-red-500/10 text-red-400":days<=7?"bg-amber-500/10 text-amber-400":"bg-emerald-500/10 text-emerald-400"}`}>{days<0?"Vencido":days===0?"Hoje":`${days} dias`}</span></div>}
function Stat({icon:Icon,label,value,detail}:{icon:typeof Gauge;label:string;value:number|string;detail:string}){return <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="mb-4 flex items-center justify-between"><span className="text-sm text-slate-400">{label}</span><Icon className="h-5 w-5 text-violet-400"/></div><div className="text-3xl font-semibold">{value}</div><div className="mt-1 text-xs text-slate-600">{detail}</div></div>}
function Bar({label,value,total}:{label:string;value:number;total:number}){const pct=Math.round(value/total*100);return <div><div className="mb-2 flex justify-between text-xs"><span className="text-slate-400">{label}</span><span>{value} · {pct}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-violet-500" style={{width:`${pct}%`}}/></div></div>}
function Empty({text}:{text:string}){return <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-slate-600">{text}</div>}
