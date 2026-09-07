import { listarEntregas, resumoIndicadores } from "@/lib/entregas";

export const dynamic = "force-dynamic";

function Card({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex-1 min-w-[140px]">
      <p className="text-slate-400 text-xs uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color ?? ""}`}>{value}</p>
    </div>
  );
}

const STATUS_LABEL: Record<string, { label: string; cor: string }> = {
  agendado: { label: "Agendado", cor: "bg-slate-600" },
  entregue: { label: "Entregue", cor: "bg-emerald-600" },
  ocorrencia: { label: "Ocorrência", cor: "bg-amber-600" },
  nao_entregue: { label: "Não entregue", cor: "bg-red-600" },
};

export default async function DashboardPage() {
  let indicadores = {
    total: 0,
    entregues: 0,
    ocorrencias: 0,
    naoEntregues: 0,
    fluvial: 0,
    rodoviario: 0,
  };
  let entregas: Awaited<ReturnType<typeof listarEntregas>> = [];
  let erro: string | null = null;

  try {
    indicadores = await resumoIndicadores();
    entregas = await listarEntregas();
  } catch (e: any) {
    erro = e.message ?? "Erro ao carregar dados. Verifique a conexão com a planilha.";
  }

  return (
    <div className="space-y-6">
      {erro && (
        <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm rounded-lg p-3">
          {erro}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <Card label="Total de cargas" value={indicadores.total} />
        <Card label="Entregues" value={indicadores.entregues} color="text-emerald-400" />
        <Card label="Ocorrências" value={indicadores.ocorrencias} color="text-amber-400" />
        <Card label="Não entregues" value={indicadores.naoEntregues} color="text-red-400" />
        <Card label="Fluvial" value={indicadores.fluvial} color="text-sky-400" />
        <Card label="Rodoviário" value={indicadores.rodoviario} color="text-amber-400" />
      </div>

      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-700 text-left">
            <tr>
              <th className="p-3">Tipo</th>
              <th className="p-3">Modal</th>
              <th className="p-3">Carregamento</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Destino</th>
              <th className="p-3">Previsão</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {entregas.slice(0, 25).map((e) => (
              <tr key={e.id} className="border-t border-slate-700">
                <td className="p-3 capitalize">{e.tipo}</td>
                <td className="p-3">{e.modal ?? "-"}</td>
                <td className="p-3">{e.numcar ?? "-"}</td>
                <td className="p-3">{e.cliente ?? "-"}</td>
                <td className="p-3">{e.destino ?? e.municent ?? "-"}</td>
                <td className="p-3">{e.data_prevista ??
