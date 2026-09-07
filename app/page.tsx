"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  Ship,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Entrega {
  id: string;
  tipo: string;
  modal: string | null;
  numcar: string | null;
  numnota: string | null;
  codcli: string | null;
  cliente: string | null;
  destino: string | null;
  municent: string | null;
  placa: string | null;
  status: string;
  created_at: string;
}

type ModalidadeFiltro = "todos" | "rodoviario" | "fluvial";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const CORES_STATUS: Record<string, string> = {
  agendado: "var(--status-agendado)",
  entregue: "var(--status-entregue)",
  ocorrencia: "var(--status-ocorrencia)",
  nao_entregue: "var(--status-nao-entregue)",
};

const LABEL_STATUS: Record<string, string> = {
  agendado: "Agendado",
  entregue: "Entregue",
  ocorrencia: "Ocorrência",
  nao_entregue: "Não entregue",
};

const ROTAS_DESTAQUE = [
  "Manacapuru",
  "Itacoatiara",
  "Iranduba",
  "Careiro da Várzea",
  "Autazes",
];

function normalizarTexto(txt: string): string {
  return txt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function parseData(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const trecho = raw.trim();
  const partesBr = trecho.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (partesBr) {
    return new Date(Number(partesBr[3]), Number(partesBr[2]) - 1, Number(partesBr[1]));
  }
  const tentativaIso = new Date(trecho);
  if (!isNaN(tentativaIso.getTime())) return tentativaIso;
  return null;
}

function CardKpi({
  label,
  valor,
  cor,
  Icone,
}: {
  label: string;
  valor: number;
  cor: string;
  Icone: any;
}) {
  return (
    <div className="glass-surface rounded-xl p-4 flex-1 min-w-[140px]">
      <div className="flex items-center gap-2 text-xs" style={{ color: cor }}>
        <Icone size={14} /> {label}
      </div>
      <p className="text-2xl font-bold font-mono-data mt-1 text-[var(--text-primary)]">{valor}</p>
    </div>
  );
}

function TooltipEscuro({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-lg p-2 text-xs"
      style={{ backgroundColor: "#101b29", border: "1px solid var(--border-subtle)" }}
    >
      <p className="text-[var(--text-muted)] mb-1">{label}</p>
      {payload.map((p: any, idx: number) => (
        <p key={idx} style={{ color: p.color || p.fill }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [modalidade, setModalidade] = useState<ModalidadeFiltro>("todos");

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const resp = await fetch("/api/entregas");
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error ?? "Erro ao carregar entregas");
        setEntregas(json);
      } catch (e: any) {
        setErro(e.message ?? "Erro ao carregar entregas");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const entregasComData = useMemo(() => {
    return entregas
      .map((e) => ({ entrega: e, data: parseData(e.created_at) }))
      .filter((x) => x.data !== null) as { entrega: Entrega; data: Date }[];
  }, [entregas]);

  const entregasDoPeriodo = useMemo(() => {
    return entregasComData.filter((x) => x.data.getFullYear() === ano && x.data.getMonth() + 1 === mes);
  }, [entregasComData, ano, mes]);

  const entregasFiltradas = useMemo(() => {
    if (modalidade === "todos") return entregasDoPeriodo;
    return entregasDoPeriodo.filter((x) => x.entrega.tipo === modalidade);
  }, [entregasDoPeriodo, modalidade]);

  const kpis = useMemo(() => {
    const total = entregasFiltradas.length;
    const entregues = entregasFiltradas.filter((x) => x.entrega.status === "entregue").length;
    const ocorrencias = entregasFiltradas.filter((x) => x.entrega.status === "ocorrencia").length;
    const naoEntregues = entregasFiltradas.filter((x) => x.entrega.status === "nao_entregue").length;
    const fluvial = entregasDoPeriodo.filter((x) => x.entrega.tipo === "fluvial").length;
    const rodoviario = entregasDoPeriodo.filter((x) => x.entrega.tipo === "rodoviario").length;
    return { total, entregues, ocorrencias, naoEntregues, fluvial, rodoviario };
  }, [entregasFiltradas, entregasDoPeriodo]);

  const diasNoMes = new Date(ano, mes, 0).getDate();

  const dadosPorDia = useMemo(() => {
    const linhas = Array.from({ length: diasNoMes }, (_, i) => ({
      dia: i + 1,
      Rodoviário: 0,
      Fluvial: 0,
    }));
    entregasFiltradas.forEach((x) => {
      const dia = x.data.getDate();
      if (x.entrega.tipo === "rodoviario") linhas[dia - 1].Rodoviário += 1;
      if (x.entrega.tipo === "fluvial") linhas[dia - 1].Fluvial += 1;
    });
    return linhas;
  }, [entregasFiltradas, diasNoMes]);

  const dadosPorDestino = useMemo(() => {
    const contagem = new Map<string, number>();
    entregasFiltradas.forEach((x) => {
      const destino = x.entrega.municent || x.entrega.destino || "Não informado";
      contagem.set(destino, (contagem.get(destino) ?? 0) + 1);
    });
    return Array.from(contagem.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 7);
  }, [entregasFiltradas]);

  const dadosStatus = useMemo(() => {
    const chaves = ["agendado", "entregue", "ocorrencia", "nao_entregue"];
    const total = entregasFiltradas.length || 1;
    return chaves.map((chave) => {
      const qtd = entregasFiltradas.filter((x) => x.entrega.status === chave).length;
      return {
        nome: LABEL_STATUS[chave],
        valor: qtd,
        percentual: Math.round((qtd / total) * 100),
        cor: CORES_STATUS[chave],
      };
    });
  }, [entregasFiltradas]);

  const dadosModalidade = useMemo(() => {
    const total = entregasDoPeriodo.length || 1;
    const rodo = entregasDoPeriodo.filter((x) => x.entrega.tipo === "rodoviario").length;
    const fluv = entregasDoPeriodo.filter((x) => x.entrega.tipo === "fluvial").length;
    return [
      { nome: "Rodoviário", valor: rodo, percentual: Math.round((rodo / total) * 100), cor: "var(--accent-rodo)" },
      { nome: "Fluvial", valor: fluv, percentual: Math.round((fluv / total) * 100), cor: "var(--accent-fluvial)" },
    ];
  }, [entregasDoPeriodo]);

  const rotasComContagem = useMemo(() => {
    return ROTAS_DESTAQUE.map((rota) => {
      const alvo = normalizarTexto(rota);
      const doRota = entregasDoPeriodo.filter((x) => {
        const destino = normalizarTexto(x.entrega.municent || x.entrega.destino || "");
        return destino.includes(alvo) || alvo.includes(destino);
      });
      const rodo = doRota.filter((x) => x.entrega.tipo === "rodoviario").length;
      const fluv = doRota.filter((x) => x.entrega.tipo === "fluvial").length;
      return { rota, total: doRota.length, rodo, fluv };
    });
  }, [entregasDoPeriodo]);

  const proximasEntregas = useMemo(() => {
    return entregasFiltradas
      .filter((x) => x.entrega.status === "agendado")
      .slice(0, 6)
      .map((x) => x.entrega);
  }, [entregasFiltradas]);

  const maxDestino = Math.max(1, ...dadosPorDestino.map((d) => d.valor));

  return (
    <div className="space-y-6 w-full">
      <div className="glass-surface rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <select
          className="bg-black/20 rounded-lg px-3 py-2 text-sm outline-none"
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
        >
          {MESES.map((nome, idx) => (
            <option key={nome} value={idx + 1} className="bg-slate-900">{nome}</option>
          ))}
        </select>
        <select
          className="bg-black/20 rounded-lg px-3 py-2 text-sm outline-none"
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
        >
          {[hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1].map((a) => (
            <option key={a} value={a} className="bg-slate-900">{a}</option>
          ))}
        </select>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setModalidade("todos")}
            className="text-xs rounded-lg px-3 py-1.5 border transition-colors"
            style={{
              borderColor: modalidade === "todos" ? "var(--text-muted)" : "var(--border-subtle)",
              backgroundColor: modalidade === "todos" ? "rgba(126,146,166,0.15)" : "transparent",
              color: modalidade === "todos" ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            Todos
          </button>
          <button
            onClick={() => setModalidade("rodoviario")}
            className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 border transition-colors"
            style={{
              borderColor: modalidade === "rodoviario" ? "var(--accent-rodo)" : "var(--border-subtle)",
              backgroundColor: modalidade === "rodoviario" ? "var(--accent-rodo-soft)" : "transparent",
              color: modalidade === "rodoviario" ? "var(--accent-rodo)" : "var(--text-muted)",
            }}
          >
            <Truck size={13} /> Rodoviário
          </button>
          <button
            onClick={() => setModalidade("fluvial")}
            className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 border transition-colors"
            style={{
              borderColor: modalidade === "fluvial" ? "var(--accent-fluvial)" : "var(--border-subtle)",
              backgroundColor: modalidade === "fluvial" ? "var(--accent-fluvial-soft)" : "transparent",
              color: modalidade === "fluvial" ? "var(--accent-fluvial)" : "var(--text-muted)",
            }}
          >
            <Ship size={13} /> Fluvial
          </button>
        </div>
      </div>

      {erro && (
        <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm rounded-lg p-3">
          {erro}
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden min-h-[260px] flex items-end">
        <Image
          src="/dashboard-hero.jpg"
          alt="Vista aérea de Manaus"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,18,28,0.25) 0%, rgba(10,18,28,0.65) 55%, rgba(10,18,28,0.95) 100%)",
          }}
        />
        <div className="relative w-full p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <CardKpi label="Total de cargas" valor={kpis.total} cor="var(--text-muted)" Icone={Package} />
            <CardKpi label="Entregues" valor={kpis.entregues} cor="var(--status-entregue)" Icone={CheckCircle2} />
            <CardKpi label="Ocorrências" valor={kpis.ocorrencias} cor="var(--status-ocorrencia)" Icone={AlertTriangle} />
            <CardKpi label="Não entregues" valor={kpis.naoEntregues} cor="var(--status-nao-entregue)" Icone={XCircle} />
            <CardKpi label="Fluvial" valor={kpis.fluvial} cor="var(--accent-fluvial)" Icone={Ship} />
            <CardKpi label="Rodoviário" valor={kpis.rodoviario} cor="var(--accent-rodo)" Icone={Truck} />
          </div>
        </div>
      </div>

      {!carregando && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="glass-surface rounded-2xl p-4 lg:col-span-2">
              <p className="text-sm font-medium mb-3">Entregas por dia</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dadosPorDia}>
                  <defs>
                    <linearGradient id="corRodo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-rodo)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--accent-rodo)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="corFluvial" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-fluvial)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--accent-fluvial)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="dia" tick={{ fill: "#7e92a6", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7e92a6", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<TooltipEscuro />} />
                  {modalidade !== "fluvial" && (
                    <Area type="monotone" dataKey="Rodoviário" stroke="var(--accent-rodo)" fill="url(#corRodo)" strokeWidth={2} />
                  )}
                  {modalidade !== "rodoviario" && (
                    <Area type="monotone" dataKey="Fluvial" stroke="var(--accent-fluvial)" fill="url(#corFluvial)" strokeWidth={2} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-surface rounded-2xl p-4">
              <p className="text-sm font-medium mb-3">Status das entregas</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={dadosStatus}
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {dadosStatus.map((d, idx) => (
                      <Cell key={idx} fill={d.cor} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipEscuro />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {dadosStatus.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.cor }} />
                      {d.nome}
                    </span>
                    <span className="font-mono-data">{d.valor} ({d.percentual}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="glass-surface rounded-2xl p-4 lg:col-span-2">
              <p className="text-sm font-medium mb-3">Entregas por destino</p>
              <div className="space-y-2">
                {dadosPorDestino.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)] w-32 truncate">{d.nome}</span>
                    <div className="flex-1 bg-black/20 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(d.valor / maxDestino) * 100}%`,
                          backgroundColor: "var(--accent-rodo)",
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono-data w-8 text-right">{d.valor}</span>
                  </div>
                ))}
                {dadosPorDestino.length === 0 && (
                  <p className="text-sm text-[var(--text-muted)]">Sem dados no período.</p>
                )}
              </div>
            </div>

            <div className="glass-surface rounded-2xl p-4">
              <p className="text-sm font-medium mb-3">Modalidade</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={dadosModalidade} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="nome" tick={{ fill: "#e8eef4", fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<TooltipEscuro />} />
                  <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                    {dadosModalidade.map((d, idx) => (
                      <Cell key={idx} fill={d.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1 px-2">
                {dadosModalidade.map((d, idx) => (
                  <span key={idx}>{d.percentual}%</span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="glass-surface rounded-2xl p-4 lg:col-span-2">
              <p className="text-sm font-medium mb-3">Rotas em destaque</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rotasComContagem.map((r, idx) => (
                  <div key={idx} className="bg-black/20 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Manaus → {r.rota}</span>
                      <span className="text-lg font-bold font-mono-data">{r.total}</span>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1" style={{ color: "var(--accent-rodo)" }}>
                        <Truck size={12} /> {r.rodo}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: "var(--accent-fluvial)" }}>
                        <Ship size={12} /> {r.fluv}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-surface rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Próximas entregas</p>
                <Link href="/entregas" className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white">
                  Ver todas <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-2">
                {proximasEntregas.map((e) => (
                  <div key={e.id} className="bg-black/20 rounded-lg p-2 text-xs">
                    <p className="font-medium">{e.cliente ?? "-"}</p>
                    <p className="text-[var(--text-muted)]">
                      {e.destino ?? e.municent ?? "-"} · {e.tipo}
                      {e.modal ? ` (${e.modal})` : ""}
                    </p>
                  </div>
                ))}
                {proximasEntregas.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)]">Nenhuma entrega agendada no período.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {carregando && <p className="text-[var(--text-muted)] text-sm">Carregando...</p>}
    </div>
  );
}
