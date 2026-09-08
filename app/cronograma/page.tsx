"use client";

import { useEffect, useMemo, useState } from "react";
import { Truck, Ship, Package, CheckCircle2, MapPin, X } from "lucide-react";

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

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function parseData(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const trecho = raw.trim();

  const partesBr = trecho.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (partesBr) {
    const dia = Number(partesBr[1]);
    const mes = Number(partesBr[2]);
    const ano = Number(partesBr[3]);
    return new Date(ano, mes - 1, dia);
  }

  const tentativaIso = new Date(trecho);
  if (!isNaN(tentativaIso.getTime())) return tentativaIso;

  return null;
}

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

interface CelulaInfo {
  linha: string;
  dia: number;
  entregas: Entrega[];
}

export default function CronogramaPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [modalidade, setModalidade] = useState<ModalidadeFiltro>("todos");

  const [celulaSelecionada, setCelulaSelecionada] = useState<CelulaInfo | null>(null);

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

  const entregasDoAno = useMemo(() => {
    return entregasComData.filter((x) => {
      if (x.data.getFullYear() !== ano) return false;
      if (modalidade !== "todos" && x.entrega.tipo !== modalidade) return false;
      return true;
    });
  }, [entregasComData, ano, modalidade]);

  const entregasDoMes = useMemo(() => {
    return entregasDoAno.filter((x) => x.data.getMonth() + 1 === mes);
  }, [entregasDoAno, mes]);

  const diasNoMes = new Date(ano, mes, 0).getDate();

  const contagemPorMes = useMemo(() => {
    const contagem: { rodo: number; fluvial: number }[] = Array.from({ length: 12 }, () => ({
      rodo: 0,
      fluvial: 0,
    }));
    entregasDoAno.forEach((x) => {
      const idx = x.data.getMonth();
      if (x.entrega.tipo === "rodoviario") contagem[idx].rodo += 1;
      if (x.entrega.tipo === "fluvial") contagem[idx].fluvial += 1;
    });
    return contagem;
  }, [entregasDoAno]);

  const maxMensal = Math.max(1, ...contagemPorMes.map((c) => c.rodo + c.fluvial));

  const linhas = useMemo(() => {
    const mapa = new Map<string, { linha: string; dias: Map<number, Entrega[]> }>();

    entregasDoMes.forEach((x) => {
      let linha: string;

      if (x.entrega.tipo === "rodoviario") {
        const bruto = x.entrega.municent || x.entrega.destino || "Não informado";
        linha = resolverMunicipio(bruto);
      } else {
        linha = x.entrega.modal ? x.entrega.modal.trim().toUpperCase() : "Fluvial (sem modal)";
      }

      const dia = x.data.getDate();

      if (!mapa.has(linha)) {
        mapa.set(linha, { linha, dias: new Map() });
      }
      const registro = mapa.get(linha)!;
      if (!registro.dias.has(dia)) registro.dias.set(dia, []);
      registro.dias.get(dia)!.push(x.entrega);
    });

    return Array.from(mapa.values()).sort((a, b) => a.linha.localeCompare(b.linha));
  }, [entregasDoMes]);

  const linhasAtivas = linhas.length;
  const cargasNoMes = entregasDoMes.length;
  const entreguesNoMes = entregasDoMes.filter((x) => x.entrega.status === "entregue").length;
  const totalNoAno = entregasDoAno.length;

  function tooltipCelula(lista: Entrega[]) {
    const linhasTexto = lista.slice(0, 3).map((e) => {
      return `${e.cliente ?? "-"} · Nota ${e.numnota ?? "-"} · Carreg. ${e.numcar ?? "-"} · ${e.tipo}${
        e.modal ? ` (${e.modal})` : ""
      } · ${e.status}`;
    });
    if (lista.length > 3) linhasTexto.push(`+ ${lista.length - 3} mais`);
    return linhasTexto.join("\n");
  }

  function placasDaCelula(lista: Entrega[]) {
    const unicas = Array.from(new Set(lista.map((e) => e.placa).filter((p): p is string => !!p && p.trim() !== "")));
    return unicas;
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-2xl font-semibold font-display tracking-tight">
          Cronograma Anual de Entregas
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Visão por município (rodoviário) ou modal (fluvial) e dia.
        </p>
      </div>

      <div className="glass-surface rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="bg-black/20 rounded-lg px-3 py-2 text-sm outline-none"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
          >
            {[hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1].map((a) => (
              <option key={a} value={a} className="bg-slate-900">{a}</option>
            ))}
          </select>

          <select
            className="bg-black/20 rounded-lg px-3 py-2 text-sm outline-none"
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
          >
            {MESES.map((nome, idx) => (
              <option key={nome} value={idx + 1} className="bg-slate-900">{nome}</option>
            ))}
          </select>

          <span className="text-sm text-[var(--text-muted)]">
            {MESES[mes - 1]} de {ano} · {diasNoMes} dias
          </span>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setModalidade("todos")}
              className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 border transition-colors"
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-surface rounded-xl p-3">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
            <Package size={14} /> Total no ano
          </div>
          <p className="text-xl font-semibold font-mono-data mt-1">{totalNoAno}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
            <Package size={14} /> Cargas no mês
          </div>
          <p className="text-xl font-semibold font-mono-data mt-1">{cargasNoMes}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--status-entregue)" }}>
            <CheckCircle2 size={14} /> Entregues
          </div>
          <p className="text-xl font-semibold font-mono-data mt-1">{entreguesNoMes}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
            <MapPin size={14} /> Municípios/Modais ativos
          </div>
          <p className="text-xl font-semibold font-mono-data mt-1">{linhasAtivas}</p>
        </div>
      </div>

      <div className="glass-surface rounded-2xl p-4">
        <p className="text-xs text-[var(--text-muted)] mb-3">Entregas por mês em {ano}</p>
        <div className="flex items-end gap-2 h-24">
          {contagemPorMes.map((c, idx) => {
            const total = c.rodo + c.fluvial;
            const alturaRodo = (c.rodo / maxMensal) * 100;
            const alturaFluvial = (c.fluvial / maxMensal) * 100;
            const ativo = idx + 1 === mes;
            return (
              <button
                key={idx}
                onClick={() => setMes(idx + 1)}
                className="flex-1 flex flex-col items-center gap-1 group"
                title={`${MESES[idx]}: ${total} entregas`}
              >
                <div
                  className="w-full flex flex-col justify-end rounded-t-sm overflow-hidden"
                  style={{
                    height: "64px",
                    opacity: ativo ? 1 : 0.55,
                    outline: ativo ? "1px solid var(--text-muted)" : "none",
                  }}
                >
                  <div style={{ height: `${alturaFluvial}%`, backgroundColor: "var(--accent-fluvial)" }} />
                  <div style={{ height: `${alturaRodo}%`, backgroundColor: "var(--accent-rodo)" }} />
                </div>
                <span className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
                  {MESES_ABREV[idx]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {erro && (
        <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm rounded-lg p-3">
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="text-[var(--text-muted)] text-sm">Carregando...</p>
      ) : (
        <div className="glass-surface rounded-2xl overflow-auto max-h-[70vh]">
          <table className="border-collapse text-sm w-full">
            <thead>
              <tr>
                <th
                  className="sticky top-0 left-0 z-20 bg-[#101b29] p-2 text-left font-medium text-[var(--text-muted)] border-b border-r border-[var(--border-subtle)]"
                  style={{ minWidth: "130px" }}
                >
                  Município / Modal
                </th>
                {Array.from({ length: diasNoMes }, (_, i) => i + 1).map((dia) => {
                  const diaSemana = new Date(ano, mes - 1, dia).getDay();
                  const fimDeSemana = diaSemana === 0 || diaSemana === 6;
                  return (
                    <th
                      key={dia}
                      className="sticky top-0 z-10 p-1 text-center font-medium border-b border-[var(--border-subtle)]"
                      style={{
                        minWidth: "38px",
                        backgroundColor: fimDeSemana ? "rgba(126,146,166,0.10)" : "#101b29",
                        color: fimDeSemana ? "var(--text-muted)" : "var(--text-primary)",
                      }}
                    >
                      <div className="text-xs font-semibold font-mono-data">{dia}</div>
                      <div className="text-[8px] text-[var(--text-muted)]">{DIAS_SEMANA[diaSemana]}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha, idxLinha) => (
                <tr key={idxLinha} className="hover:bg-white/[0.02]">
                  <td
                    className="sticky left-0 z-10 bg-[#101b29] p-2 border-r border-b border-[var(--border-subtle)] font-medium text-sm"
                    style={{ minWidth: "130px" }}
                  >
                    {linha.linha}
                  </td>
                  {Array.from({ length: diasNoMes }, (_, i) => i + 1).map((dia) => {
                    const lista = linha.dias.get(dia) ?? [];
                    const temRodo = lista.some((e) => e.tipo === "rodoviario");
                    const temFluvial = lista.some((e) => e.tipo === "fluvial");
                    const diaSemana = new Date(ano, mes - 1, dia).getDay();
                    const fimDeSemana = diaSemana === 0 || diaSemana === 6;
                    const placas = placasDaCelula(lista);

                    return (
                      <td
                        key={dia}
                        className="p-0.5 text-center border-b border-[var(--border-subtle)] cursor-pointer align-middle"
                        style={{
                          backgroundColor:
                            lista.length > 0
                              ? temRodo && temFluvial
                                ? "rgba(201,138,59,0.18)"
                                : temRodo
                                ? "var(--accent-rodo-soft)"
                                : "var(--accent-fluvial-soft)"
                              : fimDeSemana
                              ? "rgba(126,146,166,0.05)"
                              : "transparent",
                        }}
                        title={lista.length > 0 ? tooltipCelula(lista) : undefined}
                        onClick={() => {
                          if (lista.length === 0) return;
                          setCelulaSelecionada({
                            linha: linha.linha,
                            dia,
                            entregas: lista,
                          });
                        }}
                      >
                        {lista.length > 0 && (
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <div className="flex items-center gap-0.5">
                              {temRodo && (
                                <span
                                  className="w-1 h-1 rounded-full"
                                  style={{ backgroundColor: "var(--accent-rodo)" }}
                                />
                              )}
                              {temFluvial && (
                                <span
                                  className="w-1 h-1 rounded-full"
                                  style={{ backgroundColor: "var(--accent-fluvial)" }}
                                />
                              )}
                            </div>
                            <span className="text-[9px] font-mono-data leading-tight break-all">
                              {placas.length > 0 ? placas.join(" ") : lista.length}
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr>
                  <td
                    colSpan={diasNoMes + 1}
                    className="p-8 text-center text-[var(--text-muted)]"
                  >
                    Nenhuma entrega encontrada para {MESES[mes - 1]} de {ano}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {celulaSelecionada && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div
            className="glass-surface rounded-2xl p-6 max-w-lg w-full space-y-4"
            style={{ backgroundColor: "#101b29" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold font-display">
                {celulaSelecionada.linha} · dia {celulaSelecionada.dia}
              </h3>
              <button onClick={() => setCelulaSelecionada(null)} className="text-[var(--text-muted)] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {celulaSelecionada.entregas.map((e) => (
                <div key={e.id} className="bg-black/20 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{e.cliente ?? "-"}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        color: e.tipo === "fluvial" ? "var(--accent-fluvial)" : "var(--accent-rodo)",
                        backgroundColor: e.tipo === "fluvial" ? "var(--accent-fluvial-soft)" : "var(--accent-rodo-soft)",
                      }}
                    >
                      {e.tipo}{e.modal ? ` (${e.modal})` : ""}
                    </span>
                  </div>
                  <p className="text-[var(--text-muted)]">Nota: {e.numnota ?? "-"} · Carregamento: {e.numcar ?? "-"}</p>
                  <p className="text-[var(--text-muted)]">Placa: {e.placa ?? "-"}</p>
                  <p className="text-[var(--text-muted)]">Destino: {e.destino ?? "-"}</p>
                  <p className="text-[var(--text-muted)]">Status: {e.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
