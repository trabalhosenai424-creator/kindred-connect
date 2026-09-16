import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity, AlertTriangle, BarChart3, Bell, Boxes, CalendarClock,
  CheckCircle2, ClipboardCheck, FileText, Gauge, History,
  LayoutDashboard, Settings, ShieldCheck, Wrench, Plus, Search
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Instrumentação — Astra Foods" },
    { name: "description", content: "Sistema de gestão de instrumentação, calibração e metrologia da Astra Foods." },
  ]}),
  component: Index,
});

const modules = [
  ["Dashboard", LayoutDashboard], ["Instrumentos", Gauge], ["Calibração", ClipboardCheck],
  ["Padrões", ShieldCheck], ["Certificados", FileText], ["Manutenção", Wrench],
  ["Não Conformidades", AlertTriangle], ["Movimentações", History], ["Indicadores", BarChart3],
  ["Relatórios", Activity], ["Documentos", FileText], ["Alertas", Bell],
] as const;

const descriptions: Record<string, string> = {
  Dashboard: "Visão geral do sistema de Instrumentação.",
  Instrumentos: "Cadastro, consulta e acompanhamento dos instrumentos.",
  Calibração: "Registro e acompanhamento das calibrações.",
  Padrões: "Controle dos padrões utilizados nas calibrações.",
  Certificados: "Certificados e documentos de calibração.",
  Manutenção: "Controle de manutenções e intervenções.",
  "Não Conformidades": "Registro e tratamento de não conformidades.",
  Movimentações: "Histórico de movimentações dos instrumentos.",
  Indicadores: "Indicadores e métricas de desempenho.",
  Relatórios: "Relatórios operacionais e gerenciais.",
  Documentos: "Documentos relacionados à metrologia.",
  Alertas: "Alertas e pendências que exigem atenção.",
  Configurações: "Preferências e configurações do sistema.",
};

function Index() {
  const [active, setActive] = useState("Dashboard");
  const [instruments, setInstruments] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");

  const addInstrument = () => {
    if (!name.trim()) return;
    setInstruments((items) => [...items, name.trim()]);
    setName(""); setShowForm(false); setActive("Instrumentos");
  };

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-white/10 bg-slate-950 px-4 py-5 lg:block">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600"><Gauge className="h-5 w-5" /></div>
        <div><div className="font-semibold tracking-tight">INSTRUMENTAÇÃO</div><div className="text-xs text-slate-500">Astra Foods</div></div>
      </div>
      <nav className="space-y-1">
        {modules.map(([label, Icon]) => <button key={label} onClick={() => setActive(label)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${active === label ? "bg-violet-600/20 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon className="h-4 w-4"/><span>{label}</span></button>)}
      </nav>
      <button onClick={() => setActive("Configurações")} className={`absolute bottom-5 left-4 right-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active === "Configurações" ? "bg-violet-600/20 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Settings className="h-4 w-4"/>Configurações</button>
    </aside>

    <main className="lg:pl-64">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/90 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-500">Instrumentação / {active}</p><h1 className="text-2xl font-semibold tracking-tight">{active}</h1></div><div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 sm:flex"><CalendarClock className="h-4 w-4"/>Hoje</div></div>
      </header>

      <section className="space-y-6 p-6 lg:p-8">
        {active === "Dashboard" ? <Dashboard instruments={instruments} /> : active === "Instrumentos" ? <Instrumentos instruments={instruments} showForm={showForm} setShowForm={setShowForm} name={name} setName={setName} addInstrument={addInstrument} search={search} setSearch={setSearch} /> : <ModulePage title={active} description={descriptions[active] ?? "Módulo do sistema."} />}
      </section>
    </main>
  </div>;
}

function Dashboard({ instruments }: { instruments: string[] }) {
  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={Boxes} label="Instrumentos" value={String(instruments.length)} detail="Cadastrados"/><Stat icon={CalendarClock} label="Vencem este mês" value="0" detail="Calibrações"/><Stat icon={AlertTriangle} label="Vencidos" value="0" detail="Requerem atenção"/><Stat icon={CheckCircle2} label="Calibrados" value={String(instruments.length)} detail="Status atual"/></div>
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]"><section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="font-semibold">Atividade de calibração</h2><p className="mt-1 text-sm text-slate-500">Acompanhe as calibrações registradas.</p><div className="mt-6 flex min-h-64 items-center justify-center rounded-xl border border-dashed border-white/10"><div className="text-center"><Activity className="mx-auto mb-3 h-8 w-8 text-slate-700"/><p className="text-sm text-slate-500">Nenhuma calibração registrada</p></div></div></section><section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="font-semibold">Status dos instrumentos</h2><div className="mt-6 space-y-3"><Row label="Calibrados" value={String(instruments.length)}/><Row label="A vencer" value="0"/><Row label="Vencidos" value="0"/><Row label="Em manutenção" value="0"/></div></section></div>
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="font-semibold">Próximas calibrações</h2><p className="mt-1 text-sm text-slate-500">Instrumentos que exigirão atenção em breve.</p><div className="mt-5 rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-slate-500">Nenhum instrumento pendente.</div></section>
  </>;
}

function Instrumentos({ instruments, showForm, setShowForm, name, setName, addInstrument, search, setSearch }: any) {
  const filtered = instruments.filter((x: string) => x.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><h2 className="text-lg font-semibold">Cadastro de instrumentos</h2><p className="text-sm text-slate-500">Adicione instrumentos ao parque metrológico.</p></div><button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500"><Plus className="h-4 w-4"/>Novo instrumento</button></div><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"><Search className="h-4 w-4 text-slate-500"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar instrumento..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"/></div>{showForm && <div className="rounded-2xl border border-violet-500/30 bg-white/[0.04] p-5"><div className="flex gap-3"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addInstrument()} placeholder="Nome ou código do instrumento" className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-violet-500"/><button onClick={addInstrument} className="rounded-lg bg-violet-600 px-4 text-sm font-medium">Salvar</button><button onClick={() => setShowForm(false)} className="rounded-lg border border-white/10 px-4 text-sm">Cancelar</button></div></div>}<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"><div className="border-b border-white/10 px-5 py-4 text-sm text-slate-400">{filtered.length} instrumento(s)</div>{filtered.length ? filtered.map((item: string, i: number) => <div key={`${item}-${i}`} className="flex items-center justify-between border-b border-white/5 px-5 py-4 last:border-0"><span>{item}</span><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">Ativo</span></div>) : <div className="py-14 text-center text-sm text-slate-500">Nenhum instrumento cadastrado.</div>}</div></div>;
}

function ModulePage({ title, description }: { title: string; description: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8"><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/15"><Gauge className="h-6 w-6 text-violet-400"/></div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</p><div className="mt-8 rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-slate-500">Módulo pronto para receber os dados e operações.</div></div> }
function Stat({ icon: Icon, label, value, detail }: { icon: any; label: string; value: string; detail: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="mb-5 flex items-center justify-between"><span className="text-sm text-slate-400">{label}</span><Icon className="h-5 w-5 text-violet-400"/></div><div className="text-3xl font-semibold">{value}</div><div className="mt-1 text-xs text-slate-600">{detail}</div></div> }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/10 px-4 py-3"><span className="text-sm text-slate-400">{label}</span><span className="font-semibold">{value}</span></div> }
