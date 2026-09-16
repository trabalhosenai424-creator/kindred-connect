import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Instrumentação — Astra Foods" },
      {
        name: "description",
        content: "Sistema de gestão de instrumentação, calibração e metrologia da Astra Foods.",
      },
      { property: "og:title", content: "Instrumentação — Astra Foods" },
      {
        property: "og:description",
        content: "Dashboard de instrumentação, calibração e metrologia.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

const modules = [
  ["Dashboard", LayoutDashboard],
  ["Instrumentos", Gauge],
  ["Calibração", ClipboardCheck],
  ["Padrões", ShieldCheck],
  ["Certificados", FileText],
  ["Manutenção", Wrench],
  ["Não Conformidades", AlertTriangle],
  ["Movimentações", History],
  ["Indicadores", BarChart3],
  ["Relatórios", Activity],
  ["Documentos", FileText],
  ["Alertas", Bell],
];

function Index() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-white/10 bg-slate-950/95 px-4 py-5 lg:block">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-900/30">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">INSTRUMENTAÇÃO</div>
            <div className="text-xs text-slate-500">Astra Foods</div>
          </div>
        </div>

        <nav className="space-y-1">
          {modules.map(([label, Icon], index) => {
            const ModuleIcon = Icon as typeof Gauge;
            return (
              <button
                key={label as string}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  index === 0
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <ModuleIcon className="h-4 w-4" />
                <span>{label as string}</span>
              </button>
            );
          })}
        </nav>

        <button className="absolute bottom-5 left-4 right-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
          <Settings className="h-4 w-4" />
          Configurações
        </button>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/85 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Visão geral</p>
              <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 sm:flex">
              <CalendarClock className="h-4 w-4" />
              Hoje
            </div>
          </div>
        </header>

        <section className="space-y-6 p-6 lg:p-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Boxes} label="Instrumentos" value="0" detail="Cadastrados" />
            <StatCard icon={CalendarClock} label="Vencem este mês" value="0" detail="Calibrações" />
            <StatCard icon={AlertTriangle} label="Vencidos" value="0" detail="Requerem atenção" />
            <StatCard icon={CheckCircle2} label="Calibrados" value="0" detail="Status atual" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Atividade de calibração</h2>
                  <p className="mt-1 text-sm text-slate-500">Acompanhe as calibrações registradas.</p>
                </div>
                <ClipboardCheck className="h-5 w-5 text-violet-400" />
              </div>
              <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10">
                <div className="text-center">
                  <Activity className="mx-auto mb-3 h-8 w-8 text-slate-700" />
                  <p className="text-sm text-slate-500">Nenhuma calibração registrada</p>
                  <p className="mt-1 text-xs text-slate-600">Os dados aparecerão aqui quando o histórico for conectado.</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Status dos instrumentos</h2>
                  <p className="mt-1 text-sm text-slate-500">Visão rápida do parque.</p>
                </div>
                <ShieldCheck className="h-5 w-5 text-blue-400" />
              </div>
              <div className="space-y-3">
                <StatusRow label="Calibrados" value="0" />
                <StatusRow label="A vencer" value="0" />
                <StatusRow label="Vencidos" value="0" />
                <StatusRow label="Em manutenção" value="0" />
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-5">
              <h2 className="font-semibold">Próximas calibrações</h2>
              <p className="mt-1 text-sm text-slate-500">Instrumentos que exigirão atenção em breve.</p>
            </div>
            <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
              <p className="text-sm text-slate-500">Nenhum instrumento cadastrado ainda.</p>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-500/30 hover:bg-white/[0.05]">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <Icon className="h-5 w-5 text-violet-400" />
      </div>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-slate-600">{detail}</div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/10 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
