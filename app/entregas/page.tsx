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
  ChevronLeft,
  ChevronRight,
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
    cor: "#3b5f7a",
    bg: "rgba(59,95,122,0.10)",
    borda: "rgba(59,95,122,0.28)",
  },
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
};

function normalizarTexto(txt: string): string {
  return txt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

interface MembroMunicipio {
  chave: string;
  label: string;
}

const GRUPOS_MUNICIPIOS: { principal: string; membros: MembroMunicipio[] }[] = [
  {
    principal: "Manacapuru",
    membros: [
      { chave: "MANACAPURU", label: "Manacapuru" },
      { chave: "IRANDUBA", label: "Iranduba" },
      { chave: "NOVO AIRAO", label: "Novo Airão" },
    ],
  },
  {
    principal: "Presidente Figueiredo",
    membros: [{ chave: "PRESIDENTE FIGUEIREDO", label: "Presidente Figueiredo" }],
  },
  {
    principal: "Autazes",
    membros: [
      { chave: "AUTAZES", label: "Autazes" },
      { chave: "CAREIRO DA VARZEA", label: "Careiro da Várzea" },
      { chave: "CAREIRO", label: "Careiro" },
      { chave: "MANAQUIRI", label: "Manaquiri" },
    ],
  },
  {
    principal: "Silves",
    membros: [
      { chave: "SILVES", label: "Silves" },
      { chave: "ITAPIRANGA", label: "Itapiranga" },
    ],
  },
  {
    principal: "Itacoatiara",
    membros: [
      { chave: "ITACOATIARA", label: "Itacoatiara" },
      { chave: "RIO PRETO DA EVA", label: "Rio Preto da Eva" },
      { chave: "NOVO REMANSO", label: "Novo Remanso" },
    ],
  },
];

function resolverMunicipio(nomeBruto: string): string {
  const normalizado = normalizarTexto(nomeBruto);
  const grupo = GRUPOS_MUNICIPIOS.find((g) => g.membros.some((m) => m.chave === normalizado));
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

const ITENS_POR_PAGINA = 15;

export default function EntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("agendado");
  const [filtroCidade, setFiltroCidade] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [modalidade, setModalidade] = useState<ModalidadeFiltro>("rodoviario");
  const [pagina, setPagina] = useState(1);

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

  useEffect(() => {
    setPagina(1);
  }, [filtroStatus, filtroCidade, busca, modalidade]);

  const entregasPorModalidade = useMemo(() => {
    return entregas.filter((e) => e.tipo === modalidade);
  }, [entregas, modalidade]);

  const entregasPorCidade = useMemo(() => {
    if (modalidade !== "rodoviario" || !filtroCidade) return entregasPorModalidade;

    if (filtroCidade.startsWith("GRUPO:")) {
      const grupo = filtroCidade.slice(6);
      return entregasPorModalidade.filter((e) => {
        const bruto = e.municent || e.destino || "";
        return resolverMunicipio(bruto) === grupo;
      });
    }

    if (filtroCidade.startsWith("CIDADE:")) {
      const chave = filtroCidade.slice(7);
      return entregasPorModalidade.filter((e) => {
        const bruto = e.municent || e.destino || "";
        return normalizarTexto(bruto) === chave;
      });
    }

    return entregasPorModalidade;
  }, [entregasPorModalidade, filtroCidade, modalidade]);

  const entregasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return entregasPorCidade;

    return entregasPorCidade.filter((e) => {
      const campos = [e.cliente, e.numnota, e.numcar, e.placa, e.destino, e.municent, e.codcli];
      return campos.some((campo) => (campo ?? "").toLowerCase().includes(termo));
    });
  }, [entregasPorCidade, busca]);

  const totalPaginas = Math.max(1, Math.ceil(entregasFiltradas.length / ITENS_POR_PAGINA));
  const entregasDaPagina = useMemo(() => {
    const inicio = (pagina - 1) * ITENS_POR_PAGINA;
    return entregasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [entregasFiltradas, pagina]);

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
    <div className="space-y-5 w-full">
      <div>
        <h2 className="text-2xl font-semibold font-display tracking-tight" style={{ color: "var(--text-primary)" }}>
          Entregas
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Acompanhe e atualize o status de cada carga, separado por modal.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[tileRodoviario, tileFluvial].map((tile) => {
          const ativo = modalidade === tile.valor;
          const Art = tile.valor === "rodoviario" ? RodoviarioArt : FluvialArt;
          return (
            <button
              key={tile.valor}
              onClick={() => {
                setModalidade(tile.valor);
                if (tile.valor === "fluvial") setFiltroCidade("");
              }}
              className="relative text-left rounded-2xl overflow-hidden transition-all"
              style={{
                border: `1px solid ${ativo ? tile.accent : "var(--border-subtle)"}`,
                backgroundColor: "var(--bg-surface)",
                boxShadow: ativo
                  ? `0 10px 28px -12px ${tile.accent}66`
                  : "0 1px 3px rgba(17,24,39,0.04)",
              }}
            >
              <Art active={ativo} />
              <div className="p-5 flex items-end justify-between">
                <div>
                  <h3 className="font-display font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                    {tile.titulo}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {tile.subtitulo}
                  </p>
                </div>
                <span
                  className="text-4xl font-bold font-mono-data leading-none"
                  style={{ color: tile.accent }}
                >
                  {tile.total}
                </span>
              </div>
              {ativo && (
                <div
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ backgroundColor: tile.accent }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", valor: indicadores.total, cor: "var(--text-muted)", Icone: Package },
          { label: "Entregues", valor: indicadores.entregues, cor: "var(--status-entregue)", Icone: CheckCircle2 },
          { label: "Pendentes", valor: indicadores.pendentes, cor: "#3b5f7a", Icone: Clock },
          { label: "Ocorrências", valor: indicadores.ocorrencias, cor: "var(--status-ocorrencia)", Icone: TriangleAlert },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="rounded-2xl p-4 pl-5 relative overflow-hidden"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 1px 3px rgba(17,24,39,0.04)",
            }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: kpi.cor }} />
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              <kpi.Icone size={14} style={{ color: kpi.cor }} />
              {kpi.label}
            </div>
            <p className="text-2xl font-bold font-mono-data mt-1.5" style={{ color: "var(--text-primary)" }}>
              {kpi.valor}
            </p>
          </div>
        ))}
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg p-3">
          {erro}
        </div>
      )}

      <div
        className="rounded-2xl p-3 flex flex-col sm:flex-row gap-3"
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
        <div className="flex gap-3">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ backgroundColor: "var(--bg-void)" }}
          >
            <Filter size={16} style={{ color: "var(--text-muted)" }} />
            <select
              className="bg-transparent outline-none text-sm"
              style={{ color: "var(--text-primary)" }}
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="agendado">Agendado</option>
              <option value="entregue">Entregue</option>
              <option value="ocorrencia">Ocorrência</option>
              <option value="nao_entregue">Não entregue</option>
            </select>
          </div>
          {modalidade === "rodoviario" && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ backgroundColor: "var(--bg-void)" }}
            >
              <MapPin size={16} style={{ color: "var(--text-muted)" }} />
              <select
                className="bg-transparent outline-none text-sm"
                style={{ color: "var(--text-primary)" }}
                value={filtroCidade}
                onChange={(e) => setFiltroCidade(e.target.value)}
              >
                <option value="">Todas as cidades</option>
                {GRUPOS_MUNICIPIOS.map((g) => (
                  <optgroup key={g.principal} label={g.principal}>
                    <option value={`GRUPO:${g.principal}`}>{g.principal} (grupo inteiro)</option>
                    {g.membros
                      .filter((m) => m.label !== g.principal)
                      .map((m) => (
                        <option key={m.chave} value={`CIDADE:${m.chave}`}>
                          {m.label} (só ela)
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {carregando ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Carregando...</p>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "0 1px 4px rgba(17,24,39,0.05)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--bg-void)" }}>
                  <th className="p-3.5 font-semibold text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Tipo</th>
                  <th className="p-3.5 font-semibold text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Carregamento</th>
                  <th className="p-3.5 font-semibold text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Nota</th>
                  <th className="p-3.5 font-semibold text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Cliente</th>
                  <th className="p-3.5 font-semibold text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Destino</th>
                  <th className="p-3.5 font-semibold text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Status</th>
                  <th className="p-3.5 font-semibold text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Atualizado</th>
                  <th className="p-3.5 font-semibold text-left text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {entregasDaPagina.map((e) => {
                  const st = STATUS_LABEL[e.status] || STATUS_LABEL.agendado;
                  return (
                    <tr
                      key={e.id}
                      className="border-t transition-colors hover:bg-black/[0.015]"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <td className="p-3.5 capitalize whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                        {e.tipo}
                        {e.modal ? ` (${e.modal})` : ""}
                      </td>
                      <td className="p-3.5 font-mono-data" style={{ color: "var(--text-primary)" }}>{e.numcar ?? "-"}</td>
                      <td className="p-3.5 font-mono-data" style={{ color: "var(--text-primary)" }}>{e.numnota ?? "-"}</td>
                      <td className="p-3.5" style={{ color: "var(--text-primary)" }}>{e.cliente ?? "-"}</td>
                      <td className="p-3.5" style={{ color: "var(--text-primary)" }}>{e.destino ?? e.municent ?? "-"}</td>
                      <td className="p-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 border"
                          style={{ color: st.cor, backgroundColor: st.bg, borderColor: st.borda }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.cor }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono-data text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {e.data_realizada ?? "-"}
                      </td>
                      <td className="p-3.5">
                        <div className="flex gap-1">
                          <button
                            disabled={salvandoId === e.id}
                            onClick={() => marcarStatus(e.id, "entregue")}
                            title="Marcar como entregue"
                            className="p-1.5 rounded-md disabled:opacity-40 transition-colors hover:bg-black/5"
                            style={{ color: "var(--status-entregue)" }}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            disabled={salvandoId === e.id}
                            onClick={() => abrirModalOcorrencia(e)}
                            title="Registrar ocorrência"
                            className="p-1.5 rounded-md disabled:opacity-40 transition-colors hover:bg-black/5"
                            style={{ color: "var(--status-ocorrencia)" }}
                          >
                            <AlertTriangle size={16} />
                          </button>
                          <button
                            disabled={salvandoId === e.id}
                            onClick={() => marcarStatus(e.id, "nao_entregue")}
                            title="Marcar como não entregue"
                            className="p-1.5 rounded-md disabled:opacity-40 transition-colors hover:bg-black/5"
                            style={{ color: "var(--status-nao-entregue)" }}
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {entregasDaPagina.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                      Nenhuma entrega encontrada para esse filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            className="flex items-center justify-between px-4 py-3 border-t text-xs"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <span>
              {entregasFiltradas.length === 0
                ? "Nenhum resultado"
                : `Mostrando ${(pagina - 1) * ITENS_POR_PAGINA + 1}–${Math.min(pagina * ITENS_POR_PAGINA, entregasFiltradas.length)} de ${entregasFiltradas.length}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="p-1.5 rounded-md disabled:opacity-30 hover:bg-black/5"
                style={{ color: "var(--text-primary)" }}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-medium" style={{ color: "var(--text-primary)" }}>
                {pagina} / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="p-1.5 rounded-md disabled:opacity-30 hover:bg-black/5"
                style={{ color: "var(--text-primary)" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEntrega && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div
            className="rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <h3 className="text-lg font-semibold font-display" style={{ color: "var(--text-primary)" }}>Registrar ocorrência</h3>

            <div className="text-sm space-y-1" style={{ color: "var(--text-muted)" }}>
              <p><span style={{ color: "var(--text-primary)" }}>Carregamento:</span> {modalEntrega.numcar ?? "-"}</p>
              <p><span style={{ color: "var(--text-primary)" }}>Nota fiscal:</span> {modalEntrega.numnota ?? "-"}</p>
              <p><span style={{ color: "var(--text-primary)" }}>Cliente:</span> {modalEntrega.cliente ?? "-"}</p>
              <p><span style={{ color: "var(--text-primary)" }}>Código cliente:</span> {modalEntrega.codcli ?? "-"}</p>
              <p><span style={{ color: "var(--text-primary)" }}>Placa:</span> {modalEntrega.placa ?? "-"}</p>
              <p><span style={{ color: "var(--text-primary)" }}>Destino:</span> {modalEntrega.destino ?? modalEntrega.municent ?? "-"}</p>
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-primary)" }}>Produtos em falta</label>
              <div className="space-y-2">
                {produtosFalta.map((p, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Código do produto"
                      value={p.codigo}
                      onChange={(e) => atualizarProduto(idx, "codigo", e.target.value)}
                      className="flex-1 border rounded-lg p-2 text-sm outline-none"
                      style={{ backgroundColor: "var(--bg-void)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                    />
                    <input
                      type="text"
                      placeholder="Qtd"
                      value={p.quantidade}
                      onChange={(e) => atualizarProduto(idx, "quantidade", e.target.value)}
                      className="w-20 border rounded-lg p-2 text-sm outline-none"
                      style={{ backgroundColor: "var(--bg-void)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                    />
                    <button
                      onClick={() => removerProduto(idx)}
                      disabled={produtosFalta.length === 1}
                      className="disabled:opacity-30 px-2"
                      style={{ color: "var(--status-nao-entregue)" }}
                      title="Remover produto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={adicionarProduto}
                className="flex items-center gap-1 text-xs mt-2 hover:underline"
                style={{ color: "var(--accent-brand)" }}
              >
                <Plus size={14} /> Adicionar produto
              </button>
            </div>

            <label className="block text-sm" style={{ color: "var(--text-primary)" }}>
              Observação da ocorrência
              <textarea
                className="mt-1 w-full border rounded-lg p-2 text-sm outline-none"
                style={{ backgroundColor: "var(--bg-void)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                rows={3}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Descreva o que aconteceu..."
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalEntrega(null)}
                className="px-4 py-2 text-sm rounded-lg border"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
              >
                Cancelar
              </button>
              <button
                onClick={enviarOcorrencia}
                disabled={enviandoOcorrencia}
                className="px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
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
