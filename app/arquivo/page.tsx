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
    bg: "rgba(15,157,88,0.10)",
    borda: "rgba(15,157,88,0.28)",
  },
  ocorrencia: {
    label: "Ocorrência",
    cor: "var(--status-ocorrencia)",
    bg: "rgba(183,121,31,0.10)",
    borda: "rgba(183,121,31,0.28)",
  },
  nao_entregue: {
    label: "Não entregue",
    cor: "var(--status-nao-entregue)",
    bg: "rgba(209,59,59,0.10)",
    borda: "rgba(209,59,59,0.28)",
  },
  agendado: {
    label: "Agendado (parado 5+ dias)",
    cor: "#3b5f7a",
    bg: "rgba(59,95,122,0.10)",
    borda: "rgba(59,95,122,0.28)",
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
        <h2 className="text-2xl font-semibold font-display tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Archive size={22} /> Arquivo
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Entregas já resolvidas (entregues, não entregues, ocorrências ou paradas há mais de 5 dias).
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-surface rounded-xl p-3">
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Total arquivado</div>
          <p className="text-xl font-semibold font-mono-data mt-1" style={{ color: "var(--text-primary)" }}>{registros.length}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="text-xs" style={{ color: "var(--status-entregue)" }}>Entregues</div>
          <p className="text-xl font-semibold font-mono-data mt-1" style={{ color: "var(--text-primary)" }}>{totalEntregues}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="text-xs" style={{ color: "var(--status-ocorrencia)" }}>Ocorrências</div>
          <p className="text-xl font-semibold font-mono-data mt-1" style={{ color: "var(--text-primary)" }}>{totalOcorrencias}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="text-xs" style={{ color: "var(--status-nao-entregue)" }}>Não entregues</div>
          <p className="text-xl font-semibold font-mono-data mt-1" style={{ color: "var(--text-primary)" }}>{totalNaoEntregues}</p>
        </div>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg p-3">
          {erro}
        </div>
      )}

      <div
        className="rounded-xl p-3 flex flex-col sm:flex-row gap-3"
        style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "0 1px 3px rgba(17,24,39,0.04)" }}
      >
        <div
          className="flex items-center gap-2 flex-1 rounded-lg px-3 py-2"
          style={{ backgroundColor: "var(--bg-void)" }}
        >
          <Search size={16} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar por cliente, nota, carregamento, placa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ backgroundColor: "var(--bg-void)" }}
        >
          <Filter size={16} style={{ color: "var(--text-muted)" }} />
          <select
            className="bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="">Todos os modais</option>
            <option value="rodoviario">Rodoviário</option>
            <option value="fluvial">Fluvial</option>
          </select>
        </div>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ backgroundColor: "var(--bg-void)" }}
        >
          <select
            className="bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="entregue">Entregue</option>
            <option value="ocorrencia">Ocorrência</option>
            <option value="nao_entregue">Não entregue</option>
            <option value="agendado">Agendado (parado)</option>
          </select>
        </div>
      </div>

      {carregando ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Carregando...</p>
      ) : (
        <div
          className="rounded-2xl overflow-hidden overflow-x-auto"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "0 1px 4px rgba(17,24,39,0.05)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--bg-void)" }}>
                <th className="p-3 font-medium text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Tipo</th>
                <th className="p-3 font-medium text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Carregamento</th>
                <th className="p-3 font-medium text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Nota</th>
                <th className="p-3 font-medium text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Cliente</th>
                <th className="p-3 font-medium text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Destino</th>
                <th className="p-3 font-medium text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Placa</th>
                <th className="p-3 font-medium text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Status</th>
                <th className="p-3 font-medium text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Resolvido em</th>
                <th className="p-3 font-medium text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Arquivado em</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((r) => {
                const st = STATUS_LABEL[r.status] || STATUS_LABEL.agendado;
                return (
                  <tr key={r.id} className="border-t hover:bg-black/[0.015]" style={{ borderColor: "var(--border-subtle)" }}>
                    <td className="p-3 capitalize" style={{ color: "var(--text-primary)" }}>
                      <span className="flex items-center gap-1">
                        {r.tipo === "fluvial" ? <Ship size={13} /> : <Truck size={13} />}
                        {r.tipo}
                        {r.modal ? ` (${r.modal})` : ""}
                      </span>
                    </td>
                    <td className="p-3 font-mono-data" style={{ color: "var(--text-primary)" }}>{r.numcar ?? "-"}</td>
                    <td className="p-3 font-mono-data" style={{ color: "var(--text-primary)" }}>{r.numnota ?? "-"}</td>
                    <td className="p-3" style={{ color: "var(--text-primary)" }}>{r.cliente ?? "-"}</td>
                    <td className="p-3" style={{ color: "var(--text-primary)" }}>{r.destino ?? r.municent ?? "-"}</td>
                    <td className="p-3 font-mono-data" style={{ color: "var(--text-primary)" }}>{r.placa ?? "-"}</td>
                    <td className="p-3">
                      <span
                        className="text-xs rounded-full px-2 py-1 border"
                        style={{ color: st.cor, backgroundColor: st.bg, borderColor: st.borda }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="p-3 font-mono-data text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {r.data_realizada ?? "-"}
                    </td>
                    <td className="p-3 font-mono-data text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {r.arquivado_em}
                    </td>
                  </tr>
                );
              })}
              {registrosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
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
