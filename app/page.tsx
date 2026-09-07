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

export default async function DashboardPage() {
  let indicadores = { total: 0, entregues: 0, atrasados: 0, fluvial: 0, rodoviario: 0 };
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
        <Card label="Atrasados" value={indicadores.atrasados} color="text-red-400" />
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
                <td className="p-3">{e.data_prevista ?? "-"}</td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-slate-700">
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
            {entregas.length === 0 && !erro && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  Nenhuma entrega cadastrada ainda. Use a página de Importar para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
