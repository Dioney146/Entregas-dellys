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

const CONECTORES = ["DA", "DE", "DO", "DAS", "DOS", "E"];

function normalizarChave(txt: string): string {
  return txt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[_\-]+/g, " ")
    .replace(/^[A-Z]{2}\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function paraTitulo(chave: string): string {
  return chave
    .toLowerCase()
    .split(" ")
    .map((palavra, idx) => {
      const upper = palavra.toUpperCase();
      if (idx !== 0 && CONECTORES.includes(upper)) return palavra;
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(" ");
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
        const [respEntregas, respArquivo] = await Promise.all([
          fetch("/api/entregas"),
          fetch("/api/arquivo"),
        ]);

        const jsonEntregas = await respEntregas.json();
        if (!respEntregas.ok) throw new Error(jsonEntregas.error ?? "Erro ao carregar entregas");

        let jsonArquivo: any[] = [];
        try {
          const dadosArquivo = await respArquivo.json();
          if (respArquivo.ok && Array.isArray(dadosArquivo)) jsonArquivo = dadosArquivo;
        } catch {
          // se o arquivo falhar, segue só com as ativas
        }

        setEntregas([...jsonEntregas, ...jsonArquivo]);
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
        const bruto = x.entrega.destino || x.entrega.municent || "Não informado";
        const chave = normalizarChave(bruto);
        linha = chave ? paraTitulo(chave) : "Não informado";
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
        <h2 className="text-2xl font-semibold font-display tracking-tight" style={{ color: "var(--text-primary)" }}>
          Cronograma Anual de Entregas
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Visão por destino (rodoviário) ou modal (fluvial) e dia.
        </p>
      </div>

      <div className="glass-surface rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-lg px-3 py-2 text-sm outline-none border"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
          >
            {[hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            className="rounded-lg px-3 py-2 text-sm outline-none border"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
          >
            {MESES.map((nome, idx) => (
              <option key={nome} value={idx + 1}>{nome}</option>
            ))}
          </select>

          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {MESES[mes - 1]} de {ano} · {diasNoMes} dias
          </span>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setModalidade("todos")}
              className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 border transition-colors"
              style={{
                borderColor: modalidade === "todos" ? "var(--text-muted)" : "var(--border-subtle)",
                backgroundColor: modalidade === "todos" ? "rgba(107,114,128,0.12)" : "transparent",
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
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <Package size={14} /> Total no ano
          </div>
          <p className="text-xl font-semibold font-mono-data mt-1" style={{ color: "var(--text-primary)" }}>{totalNoAno}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <Package size={14} /> Cargas no mês
          </div>
          <p className="text-xl font-semibold font-mono-data mt-1" style={{ color: "var(--text-primary)" }}>{cargasNoMes}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--status-entregue)" }}>
            <CheckCircle2 size={14} /> Entregues
          </div>
          <p className="text-xl font-semibold font-mono-data mt-1" style={{ color: "var(--text-primary)" }}>{entreguesNoMes}</p>
        </div>
        <div className="glass-surface rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <MapPin size={14} /> Destinos/Modais ativos
          </div>
          <p className="text-xl font-semibold font-mono-data mt-1" style={{ color: "var(--text-primary)" }}>{linhasAtivas}</p>
        </div>
      </div>

      <div className="glass-surface rounded-2xl p-4">
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Entregas por mês em {ano}</p>
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
                    backgroundColor: "var(--border-subtle)",
                    opacity: ativo ? 1 : 0.55,
                    outline: ativo ? "1px solid var(--text-muted)" : "none",
                  }}
                >
                  <div style={{ height: `${alturaFluvial}%`, backgroundColor: "var(--accent-fluvial)" }} />
                  <div style={{ height: `${alturaRodo}%`, backgroundColor: "var(--accent-rodo)" }} />
                </div>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {MESES_ABREV[idx]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg p-3">
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Carregando...</p>
      ) : (
        <div className="glass-surface rounded-2xl overflow-auto max-h-[70vh]">
          <table className="border-collapse text-sm w-full">
            <thead>
              <tr>
                <th
                  className="sticky top-0 left-0 z-20 p-2 text-left font-medium border-b border-r"
                  style={{
                    minWidth: "130px",
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  Destino / Modal
                </th>
                {Array.from({ length: diasNoMes }, (_, i) => i + 1).map((dia) => {
                  const diaSemana = new Date(ano, mes - 1, dia).getDay();
                  const fimDeSemana = diaSemana === 0 || diaSemana === 6;
                  return (
                    <th
                      key={dia}
                      className="sticky top-0 z-10 p-1 text-center font-medium border-b"
                      style={{
                        minWidth: "38px",
                        backgroundColor: fimDeSemana ? "rgba(107,114,128,0.08)" : "var(--bg-surface)",
                        borderColor: "var(--border-subtle)",
                        color: fimDeSemana ? "var(--text-muted)" : "var(--text-primary)",
                      }}
                    >
                      <div className="text-xs font-semibold font-mono-data">{dia}</div>
                      <div className="text-[8px]" style={{ color: "var(--text-muted)" }}>{DIAS_SEMANA[diaSemana]}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha, idxLinha) => (
                <tr key={idxLinha} className="hover:bg-black/[0.02]">
                  <td
                    className="sticky left-0 z-10 p-2 border-r border-b font-medium text-sm"
                    style={{
                      minWidth: "130px",
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
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
                        className="p-0.5 text-center border-b cursor-pointer align-middle"
                        style={{
                          borderColor: "var(--border-subtle)",
                          backgroundColor:
                            lista.length > 0
                              ? temRodo && temFluvial
                                ? "rgba(179,120,30,0.15)"
                                : temRodo
                                ? "var(--accent-rodo-soft)"
                                : "var(--accent-fluvial-soft)"
                              : fimDeSemana
                              ? "rgba(107,114,128,0.05)"
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
                            <span className="text-[9px] font-mono-data leading-tight break-all" style={{ color: "var(--text-primary)" }}>
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
                    className="p-8 text-center"
                    style={{ color: "var(--text-muted)" }}
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div
            className="glass-surface rounded-2xl p-6 max-w-lg w-full space-y-4"
            style={{ backgroundColor: "var(--bg-surface)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold font-display" style={{ color: "var(--text-primary)" }}>
                {celulaSelecionada.linha} · dia {celulaSelecionada.dia}
              </h3>
              <button onClick={() => setCelulaSelecionada(null)} style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {celulaSelecionada.entregas.map((e) => (
                <div key={e.id} className="rounded-lg p-3 text-sm space-y-1" style={{ backgroundColor: "rgba(107,114,128,0.06)" }}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>{e.cliente ?? "-"}</span>
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
                  <p style={{ color: "var(--text-muted)" }}>Nota: {e.numnota ?? "-"} · Carregamento: {e.numcar ?? "-"}</p>
                  <p style={{ color: "var(--text-muted)" }}>Placa: {e.placa ?? "-"}</p>
                  <p style={{ color: "var(--text-muted)" }}>Destino: {e.destino ?? "-"}</p>
                  <p style={{ color: "var(--text-muted)" }}>Status: {e.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
