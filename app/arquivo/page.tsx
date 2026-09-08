"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Archive, Truck, Ship } from "lucide-react";

interface RegistroArquivo {
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
  data_realizada: string | null;
  created_at: string;
  arquivado_em: string;
}

interface StatusInfo {
  label: string;
  cor: string;
  bg: string;
  borda: string;
}

const STATUS_LABEL: { [chave: string]: StatusInfo } = {
  entregue: {
    label: "Entregue",
    cor: "var(--status-entregue)",
    bg: "rgba(52,211,153,0.15)",
    borda: "rgba(52,211,153,0.35)",
  },
  ocorrencia: {
    label: "Ocorrência",
    cor: "var(--status-ocorrencia)",
    bg: "rgba(245,165,36,0.15)",
    borda: "rgba(245,165,36,0.35)",
  },
  nao_entregue: {
    label: "Não entregue",
    cor: "var(--status-nao-entregue)",
    bg: "rgba(240,82,107,0.15)",
    borda: "rgba(240,82,107,0.35)",
  },
  agendado: {
    label: "Agendado (parado 5+ dias)",
    cor: "var(--status-agendado)",
    bg: "rgba(100,116,139,0.15)",
    borda: "rgba(100,116,139,0.35)",
  },
};

export default function ArquivoPage() {
  const [registros, setRegistros] = useState<RegistroArquivo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const resp = await fetch("/api/arquivo");
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error ?? "Erro ao carregar arquivo");
        setRegistros(json);
      } catch (e: any) {
        setErro(e.message ?? "Erro ao carregar arquivo");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const registrosFiltrados = useMemo(() => {
    let lista = registros;

    if (filtroTipo) lista = lista.filter((r) => r.tipo === filtroTipo);
    if (filtroStatus) lista = lista.filter((r) => r.status === filtroStatus);

    const termo = busca.trim().toLowerCase();
    if (termo) {
      lista = lista.filter((r) => {
        const campos = [r.cliente, r.numnota, r.numcar, r.placa, r.destino, r.municent, r.codcli];
        return campos.some((campo) => (campo ?? "").toLowerCase().includes(termo));
      });
    }

    return lista;
  }, [registros, filtroTipo, filtroStatus, busca]);

  const totalEntregues = registros.filter((r) => r.status === "entregue").length;
  const totalOcorrencias = registros.filter((r) => r.status === "ocorrencia").length;
  const totalNaoEntregues = registros.filter((r) => r.status === "nao_entregue").length;

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-2xl font-semibold font-display tracking-tight flex items-center gap-2">
          <Archive size={22} /> Arquivo
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Entregas já resolvidas (entregues, não entregues, ocorrências ou paradas há mais de 5 dias).
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-surface rounded-xl p-3">
          <div className="text-[var(--text-muted)] text-xs">Total arquivado</div>
          <p className="text-xl font-semibold font-mono-data mt-1">{registros.length}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="text-xs" style={{ color: "var(--status-entregue)" }}>Entregues</div>
          <p className="text-xl font-semibold font-mono-data mt-1">{totalEntregues}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="text-xs" style={{ color: "var(--status-ocorrencia)" }}>Ocorrências</div>
          <p className="text-xl font-semibold font-mono-data mt-1">{totalOcorrencias}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="text-xs" style={{ color: "var(--status-nao-entregue)" }}>Não entregues</div>
          <p className="text-xl font-semibold font-mono-data mt-1">{totalNaoEntregues}</p>
        </div>
      </div>

      {erro && (
        <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm rounded-lg p-3">
          {erro}
        </div>
      )}

      <div className="glass-surface rounded-xl p-3 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 bg-black/20 rounded-lg px-3 py-2">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por cliente, nota, carregamento, placa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="bg-transparent outline-none text-sm w-full placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
          <Filter size={16} className="text-[var(--text-muted)]" />
          <select
            className="bg-transparent outline-none text-sm"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="" className="bg-slate-900">Todos os modais</option>
            <option value="rodoviario" className="bg-slate-900">Rodoviário</option>
            <option value="fluvial" className="bg-slate-900">Fluvial</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
          <select
            className="bg-transparent outline-none text-sm"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="" className="bg-slate-900">Todos os status</option>
            <option value="entregue" className="bg-slate-900">Entregue</option>
            <option value="ocorrencia" className="bg-slate-900">Ocorrência</option>
            <option value="nao_entregue" className="bg-slate-900">Não entregue</option>
            <option value="agendado" className="bg-slate-900">Agendado (parado)</option>
          </select>
        </div>
      </div>

      {carregando ? (
        <p className="text-[var(--text-muted)] text-sm">Carregando...</p>
      ) : (
        <div className="glass-surface rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/20 text-left text-[var(--text-muted)]">
              <tr>
                <th className="p-3 font-medium">Tipo</th>
                <th className="p-3 font-medium">Carregamento</th>
                <th className="p-3 font-medium">Nota</th>
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium">Destino</th>
                <th className="p-3 font-medium">Placa</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Resolvido em</th>
                <th className="p-3 font-medium">Arquivado em</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((r) => {
                const st = STATUS_LABEL[r.status] || STATUS_LABEL.agendado;
                return (
                  <tr key={r.id} className="border-t border-[var(--border-subtle)] hover:bg-white/[0.02]">
                    <td className="p-3 capitalize">
                      <span className="flex items-center gap-1">
                        {r.tipo === "fluvial" ? <Ship size={13} /> : <Truck size={13} />}
                        {r.tipo}
                        {r.modal ? ` (${r.modal})` : ""}
                      </span>
                    </td>
                    <td className="p-3 font-mono-data text-[var(--text-primary)]">{r.numcar ?? "-"}</td>
                    <td className="p-3 font-mono-data text-[var(--text-primary)]">{r.numnota ?? "-"}</td>
                    <td className="p-3">{r.cliente ?? "-"}</td>
                    <td className="p-3">{r.destino ?? r.municent ?? "-"}</td>
                    <td className="p-3 font-mono-data">{r.placa ?? "-"}</td>
                    <td className="p-3">
                      <span
                        className="text-xs rounded-full px-2 py-1 border"
                        style={{ color: st.cor, backgroundColor: st.bg, borderColor: st.borda }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="p-3 font-mono-data text-[var(--text-muted)] text-xs whitespace-nowrap">
                      {r.data_realizada ?? "-"}
                    </td>
                    <td className="p-3 font-mono-data text-[var(--text-muted)] text-xs whitespace-nowrap">
                      {r.arquivado_em}
                    </td>
                  </tr>
                );
              })}
              {registrosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[var(--text-muted)]">
                    Nenhum registro arquivado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
