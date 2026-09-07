import { getSheet } from "@/lib/sheets";
import { listarEntregas } from "@/lib/entregas";

export const dynamic = "force-dynamic";

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export default async function CronogramaPage() {
  const anoAtual = new Date().getFullYear();
  let grid: Record<number, { fluvial: number; rodoviario: number }> = {};
  for (let m = 0; m < 12; m++) grid[m] = { fluvial: 0, rodoviario: 0 };
  let erro: string | null = null;

  try {
    const entregas = await listarEntregas();
    entregas.forEach((e) => {
      if (!e.data_prevista) return;
      const data = new Date(e.data_prevista);
      if (data.getFullYear() !== anoAtual) return;
      const mes = data.getMonth();
      if (e.tipo === "fluvial") grid[mes].fluvial += 1;
      if (e.tipo === "rodoviario") grid[mes].rodoviario += 1;
    });
  } catch (e: any) {
    erro = e.message ?? "Erro ao carregar dados da planilha.";
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Cronograma {anoAtual}</h2>

      {erro && (
        <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm rounded-lg p-3">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {MESES.map((label, idx) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4">
            <p className="text-sm text-slate-400">{label}</p>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-sky-400">Fluvial: {grid[idx].fluvial}</p>
              <p className="text-amber-400">Rodoviário: {grid[idx].rodoviario}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Contagem baseada na data prevista das entregas cadastradas na planilha.
      </p>
    </div>
  );
}
