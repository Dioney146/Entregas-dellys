"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Clock,
  TriangleAlert,
  Plus,
  Trash2,
  MapPin,
} from "lucide-react";
import { RodoviarioArt, FluvialArt } from "./illustrations";

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
  data_realizada: string | null;
  status: "agendado" | "entregue" | "ocorrencia" | "nao_entregue";
}

type ModalidadeFiltro = "rodoviario" | "fluvial";

interface StatusInfo {
  label: string;
  cor: string;
  bg: string;
  borda: string;
}

interface ProdutoFaltaLinha {
  codigo: string;
  quantidade: string;
}

const STATUS_LABEL: { [chave: string]: StatusInfo } = {
  agendado: {
    label: "Agendado",
    cor: "var(--status-agendado)",
    bg: "rgba(100,116,139,0.15)",
    borda: "rgba(100,116,139,0.35)",
  },
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
};

function normalizarTexto(txt: string): string {
  return txt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

const GRUPOS_MUNICIPIOS: { principal: string; aliases: string[] }[] = [
  { principal: "Manacapuru", aliases: ["MANACAPURU", "IRANDUBA", "NOVO AIRAO"] },
  { principal: "Presidente Figueiredo", aliases: ["PRESIDENTE FIGUEIREDO"] },
  { principal: "Autazes", aliases: ["AUTAZES", "CAREIRO DA VARZEA", "CAREIRO", "MANAQUIRI"] },
  { principal: "Silves", aliases: ["SILVES", "ITAPIRANGA"] },
  { principal: "Itacoatiara", aliases: ["ITACOATIARA", "RIO PRETO DA EVA", "NOVO REMANSO"] },
];

function resolverMunicipio(nomeBruto: string): string {
  const normalizado = normalizarTexto(nomeBruto);
  const grupo = GRUPOS_MUNICIPIOS.find((g) => g.aliases.includes(normalizado));
  if (grupo) return grupo.principal;
  return nomeBruto.trim();
}

function dataFormatada(): string {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, "0");
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${agora.getFullYear()}`;
}

function dataHoraFormatada(): string {
  const agora = new Date();
  const hora = String(agora.getHours()).padStart(2, "0");
  const min = String(agora.getMinutes()).padStart(2, "0");
  const seg = String(agora.getSeconds()).padStart(2, "0");
  return `${dataFormatada()} ${hora}:${min}:${seg}`;
}

export default function EntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("agendado");
  const [filtroCidade, setFiltroCidade] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [modalidade, setModalidade] = useState<ModalidadeFiltro>("rodoviario");

  const [modalEntrega, setModalEntrega] = useState<Entrega | null>(null);
  const [obs, setObs] = useState("");
  const [produtosFalta, setProdutosFalta] = useState<ProdutoFaltaLinha[]>([
    { codigo: "", quantidade: "" },
  ]);
  const [enviandoOcorrencia, setEnviandoOcorrencia] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const url = filtroStatus ? `/api/entregas?status=${filtroStatus}` : "/api/entregas";
      const resp = await fetch(url);
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "Erro ao carregar entregas");
      setEntregas(json);
    } catch (e: any) {
      setErro(e.message ?? "Erro ao carregar entregas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus]);

  const entregasPorModalidade = useMemo(() => {
    return entregas.filter((e) => e.tipo === modalidade);
  }, [entregas, modalidade]);

  const entregasPorCidade = useMemo(() => {
    if (modalidade !== "rodoviario" || !filtroCidade) return entregasPorModalidade;
    return entregasPorModalidade.filter((e) => {
      const bruto = e.municent || e.destino || "";
      return resolverMunicipio(bruto) === filtroCidade;
    });
  }, [entregasPorModalidade, filtroCidade, modalidade]);

  const entregasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return entregasPorCidade;

    return entregasPorCidade.filter((e) => {
      const campos = [e.cliente, e.numnota, e.numcar, e.placa, e.destino, e.municent, e.codcli];
      return campos.some((campo) => (campo ?? "").toLowerCase().includes(termo));
    });
  }, [entregasPorCidade, busca]);

  const indicadores = useMemo(() => {
    const total = entregasPorCidade.length;
    const entregues = entregasPorCidade.filter((e) => e.status === "entregue").length;
    const pendentes = entregasPorCidade.filter((e) => e.status === "agendado").length;
    const ocorrencias = entregasPorCidade.filter((e) => e.status === "ocorrencia").length;
    return { total, entregues, pendentes, ocorrencias };
  }, [entregasPorCidade]);

  const totalRodoviario = entregas.filter((e) => e.tipo === "rodoviario").length;
  const totalFluvial = entregas.filter((e) => e.tipo === "fluvial").length;

  function removerDaLista(id: string) {
    setEntregas((prev) => prev.filter((e) => e.id !== id));
  }

  async function marcarStatus(id: string, status: "entregue" | "nao_entregue") {
    setSalvandoId(id);
    try {
      const dataRealizada = status === "nao_entregue" ? dataHoraFormatada() : dataFormatada();
      const resp = await fetch("/api/entregas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, data_realizada: dataRealizada }),
      });
      if (!resp.ok) {
        const json = await resp.json();
        throw new Error(json.error ?? "Erro ao atualizar status");
      }
      removerDaLista(id);
    } catch (e: any) {
      alert(e.message ?? "Erro ao atualizar status");
    } finally {
      setSalvandoId(null);
    }
  }

  function abrirModalOcorrencia(entrega: Entrega) {
    setModalEntrega(entrega);
    setObs("");
    setProdutosFalta([{ codigo: "", quantidade: "" }]);
  }

  function atualizarProduto(indice: number, campo: "codigo" | "quantidade", valor: string) {
    setProdutosFalta((prev) =>
      prev.map((p, i) => (i === indice ? { ...p, [campo]: valor } : p))
    );
  }

  function adicionarProduto() {
    setProdutosFalta((prev) => [...prev, { codigo: "", quantidade: "" }]);
  }

  function removerProduto(indice: number) {
    setProdutosFalta((prev) => prev.filter((_, i) => i !== indice));
  }

  async function enviarOcorrencia() {
    if (!modalEntrega) return;
    setEnviandoOcorrencia(true);
    try {
      const dataRealizada = dataFormatada();

      const produtosTexto = produtosFalta
        .filter((p) => p.codigo.trim() !== "" || p.quantidade.trim() !== "")
        .map((p) => `${p.codigo.trim()}:${p.quantidade.trim()}`)
        .join(", ");

      const obsCompleta = produtosTexto
        ? `${obs ? obs + " | " : ""}Produtos em falta: ${produtosTexto}`
        : obs;

      const resp = await fetch("/api/ocorrencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entrega_id: modalEntrega.id,
          carregamento: modalEntrega.numcar,
          numnota: modalEntrega.numnota,
          cliente: modalEntrega.cliente,
          codcli: modalEntrega.codcli,
          placa: modalEntrega.placa,
          destino: modalEntrega.destino ?? modalEntrega.municent,
          obs: obsCompleta,
          data_realizada: dataRealizada,
          produtos_falta: produtosTexto,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "Erro ao registrar ocorrência");

      removerDaLista(modalEntrega.id);
      setModalEntrega(null);
    } catch (e: any) {
      alert(e.message ?? "Erro ao registrar ocorrência");
    } finally {
      setEnviandoOcorrencia(false);
    }
  }

  const tileRodoviario = {
    valor: "rodoviario" as ModalidadeFiltro,
    titulo: "Rodoviário",
    subtitulo: "Entregas por estrada",
    total: totalRodoviario,
    accent: "var(--accent-rodo)",
  };
  const tileFluvial = {
    valor: "fluvial" as ModalidadeFiltro,
    titulo: "Fluvial",
    subtitulo: "Entregas pelos rios da Amazônia",
    total: totalFluvial,
    accent: "var(--accent-fluvial)",
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-2xl font-semibold font-display tracking-tight">Entregas</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Acompanhe e atualize o status de cada carga, separado por modal.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => {
            setModalidade(tileRodoviario.valor);
          }}
          className="text-left rounded-2xl overflow-hidden glass-surface transition-all"
          style={{
            borderColor: modalidade === "rodoviario" ? tileRodoviario.accent : "var(--border-subtle)",
            boxShadow:
              modalidade === "rodoviario"
                ? `0 0 0 1px ${tileRodoviario.accent}, 0 8px 24px -8px ${tileRodoviario.accent}55`
                : "none",
            opacity: modalidade === "rodoviario" ? 1 : 0.85,
          }}
        >
          <RodoviarioArt active={modalidade === "rodoviario"} />
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-medium text-base">{tileRodoviario.titulo}</h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono-data"
                style={{ color: tileRodoviario.accent, backgroundColor: `${tileRodoviario.accent}22` }}
              >
                {tileRodoviario.total}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">{tileRodoviario.subtitulo}</p>
          </div>
        </button>

        <button
          onClick={() => {
            setModalidade(tileFluvial.valor);
            setFiltroCidade("");
          }}
          className="text-left rounded-2xl overflow-hidden glass-surface transition-all"
          style={{
            borderColor: modalidade === "fluvial" ? tileFluvial.accent : "var(--border-subtle)",
            boxShadow:
              modalidade === "fluvial"
                ? `0 0 0 1px ${tileFluvial.accent}, 0 8px 24px -8px ${tileFluvial.accent}55`
                : "none",
            opacity: modalidade === "fluvial" ? 1 : 0.85,
          }}
        >
          <FluvialArt active={modalidade === "fluvial"} />
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-medium text-base">{tileFluvial.titulo}</h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono-data"
                style={{ color: tileFluvial.accent, backgroundColor: `${tileFluvial.accent}22` }}
              >
                {tileFluvial.total}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">{tileFluvial.subtitulo}</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-surface rounded-xl p-3">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
            <Package size={14} /> Total
          </div>
          <p className="text-xl font-semibold font-mono-data mt-1">{indicadores.total}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--status-entregue)" }}>
            <CheckCircle2 size={14} /> Entregues
          </div>
          <p className="text-xl font-semibold font-mono-data mt-1">{indicadores.entregues}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--status-agendado)" }}>
            <Clock size={14} /> Pendentes
          </div>
          <p className="text-xl font-semibold font-mono-data mt-1">{indicadores.pendentes}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--status-ocorrencia)" }}>
            <TriangleAlert size={14} /> Ocorrências
          </div>
          <p className="text-xl font-semibold font-mono-data mt-1">{indicadores.ocorrencias}</p>
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
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="" className="bg-slate-900">Todos os status</option>
            <option value="agendado" className="bg-slate-900">Agendado</option>
            <option value="entregue" className="bg-slate-900">Entregue</option>
            <option value="ocorrencia" className="bg-slate-900">Ocorrência</option>
            <option value="nao_entregue" className="bg-slate-900">Não entregue</option>
          </select>
        </div>
        {modalidade === "rodoviario" && (
          <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
            <MapPin size={16} className="text-[var(--text-muted)]" />
            <select
              className="bg-transparent outline-none text-sm"
              value={filtroCidade}
              onChange={(e) => setFiltroCidade(e.target.value)}
            >
              <option value="" className="bg-slate-900">Todas as cidades</option>
              {GRUPOS_MUNICIPIOS.map((g) => (
                <option key={g.principal} value={g.principal} className="bg-slate-900">
                  {g.principal}
                </option>
              ))}
            </select>
          </div>
        )}
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
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Atualizado em</th>
                <th className="p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {entregasFiltradas.map((e) => {
                const st = STATUS_LABEL[e.status] || STATUS_LABEL.agendado;
                return (
                  <tr key={e.id} className="border-t border-[var(--border-subtle)] hover:bg-white/[0.02]">
                    <td className="p-3 capitalize">
                      {e.tipo}
                      {e.modal ? ` (${e.modal})` : ""}
                    </td>
                    <td className="p-3 font-mono-data text-[var(--text-primary)]">{e.numcar ?? "-"}</td>
                    <td className="p-3 font-mono-data text-[var(--text-primary)]">{e.numnota ?? "-"}</td>
                    <td className="p-3">{e.cliente ?? "-"}</td>
                    <td className="p-3">{e.destino ?? e.municent ?? "-"}</td>
                    <td className="p-3">
                      <span
                        className="text-xs rounded-full px-2 py-1 border"
                        style={{ color: st.cor, backgroundColor: st.bg, borderColor: st.borda }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="p-3 font-mono-data text-[var(--text-muted)] text-xs whitespace-nowrap">
                      {e.data_realizada ?? "-"}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5">
                        <button
                          disabled={salvandoId === e.id}
                          onClick={() => marcarStatus(e.id, "entregue")}
                          title="Marcar como entregue"
                          className="flex items-center gap-1 border border-[var(--status-entregue)]/40 text-[var(--status-entregue)] hover:bg-[var(--status-entregue)]/10 disabled:opacity-40 text-xs rounded-lg px-2 py-1 transition-colors"
                        >
                          <CheckCircle2 size={13} /> Entregue
                        </button>
                        <button
                          disabled={salvandoId === e.id}
                          onClick={() => abrirModalOcorrencia(e)}
                          title="Registrar ocorrência"
                          className="flex items-center gap-1 border border-[var(--status-ocorrencia)]/40 text-[var(--status-ocorrencia)] hover:bg-[var(--status-ocorrencia)]/10 disabled:opacity-40 text-xs rounded-lg px-2 py-1 transition-colors"
                        >
                          <AlertTriangle size={13} /> Ocorrência
                        </button>
                        <button
                          disabled={salvandoId === e.id}
                          onClick={() => marcarStatus(e.id, "nao_entregue")}
                          title="Marcar como não entregue"
                          className="flex items-center gap-1 border border-[var(--status-nao-entregue)]/40 text-[var(--status-nao-entregue)] hover:bg-[var(--status-nao-entregue)]/10 disabled:opacity-40 text-xs rounded-lg px-2 py-1 transition-colors"
                        >
                          <XCircle size={13} /> Não entregue
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {entregasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[var(--text-muted)]">
                    Nenhuma entrega encontrada para esse filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalEntrega && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="glass-surface rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "#101b29" }}>
            <h3 className="text-lg font-semibold font-display">Registrar ocorrência</h3>

            <div className="text-sm text-[var(--text-muted)] space-y-1">
              <p><span className="text-[var(--text-primary)]">Carregamento:</span> {modalEntrega.numcar ?? "-"}</p>
              <p><span className="text-[var(--text-primary)]">Nota fiscal:</span> {modalEntrega.numnota ?? "-"}</p>
              <p><span className="text-[var(--text-primary)]">Cliente:</span> {modalEntrega.cliente ?? "-"}</p>
              <p><span className="text-[var(--text-primary)]">Código cliente:</span> {modalEntrega.codcli ?? "-"}</p>
              <p><span className="text-[var(--text-primary)]">Placa:</span> {modalEntrega.placa ?? "-"}</p>
              <p><span className="text-[var(--text-primary)]">Destino:</span> {modalEntrega.destino ?? modalEntrega.municent ?? "-"}</p>
            </div>

            <div>
              <label className="block text-sm mb-2">Produtos em falta</label>
              <div className="space-y-2">
                {produtosFalta.map((p, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Código do produto"
                      value={p.codigo}
                      onChange={(e) => atualizarProduto(idx, "codigo", e.target.value)}
                      className="flex-1 bg-black/20 border border-[var(--border-subtle)] rounded-lg p-2 text-sm outline-none focus:border-[var(--status-ocorrencia)]"
                    />
                    <input
                      type="text"
                      placeholder="Qtd"
                      value={p.quantidade}
                      onChange={(e) => atualizarProduto(idx, "quantidade", e.target.value)}
                      className="w-20 bg-black/20 border border-[var(--border-subtle)] rounded-lg p-2 text-sm outline-none focus:border-[var(--status-ocorrencia)]"
                    />
                    <button
                      onClick={() => removerProduto(idx)}
                      disabled={produtosFalta.length === 1}
                      className="text-[var(--status-nao-entregue)] disabled:opacity-30 px-2"
                      title="Remover produto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={adicionarProduto}
                className="flex items-center gap-1 text-xs mt-2 text-[var(--accent-brand)] hover:underline"
              >
                <Plus size={14} /> Adicionar produto
              </button>
            </div>

            <label className="block text-sm">
              Observação da ocorrência
              <textarea
                className="mt-1 w-full bg-black/20 border border-[var(--border-subtle)] rounded-lg p-2 text-sm outline-none focus:border-[var(--status-ocorrencia)]"
                rows={3}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Descreva o que aconteceu..."
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalEntrega(null)}
                className="px-4 py-2 text-sm rounded-lg border border-[var(--border-subtle)] hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={enviarOcorrencia}
                disabled={enviandoOcorrencia}
                className="px-4 py-2 text-sm rounded-lg text-black font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--status-ocorrencia)" }}
              >
                {enviandoOcorrencia ? "Salvando..." : "Salvar ocorrência"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
