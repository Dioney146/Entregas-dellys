import { getSheet } from "./sheets";
import { Entrega, StatusEntrega, TipoEntrega } from "./types";

function linhaParaEntrega(row: any): Entrega {
  return {
    id: row.get("id"),
    tipo: row.get("tipo"),
    modal: row.get("modal") || null,
    numcar: row.get("numcar") || null,
    numnota: row.get("numnota") || null,
    numped: row.get("numped") || null,
    codcli: row.get("codcli") || null,
    cliente: row.get("cliente") || null,
    bairroent: row.get("bairroent") || null,
    municent: row.get("municent") || null,
    destino: row.get("destino") || null,
    totpeso: row.get("totpeso") || null,
    placa: row.get("placa") || null,
    praca: row.get("praca") || null,
    uf: row.get("uf") || null,
    data_prevista: row.get("data_prevista") || null,
    data_realizada: row.get("data_realizada") || null,
    status: (row.get("status") || "agendado") as StatusEntrega,
    observacao: row.get("observacao") || null,
    created_at: row.get("created_at") || "",
  };
}

export interface FiltrosEntrega {
  tipo?: TipoEntrega;
  status?: StatusEntrega;
  praca?: string;
}

export async function listarEntregas(filtros: FiltrosEntrega = {}) {
  const sheet = await getSheet("entregas");
  const rows = await sheet.getRows();
  let entregas = rows.map(linhaParaEntrega);

  if (filtros.tipo) entregas = entregas.filter((e) => e.tipo === filtros.tipo);
  if (filtros.status) entregas = entregas.filter((e) => e.status === filtros.status);
  if (filtros.praca) entregas = entregas.filter((e) => e.praca === filtros.praca);

  return entregas;
}

export async function inserirEntregas(entregas: Partial<Entrega>[]) {
  const sheet = await getSheet("entregas");
  const agora = new Date().toISOString();

  const linhas = entregas.map((e) => ({
    id: crypto.randomUUID(),
    tipo: e.tipo ?? "",
    modal: e.modal ?? "",
    numcar: e.numcar ?? "",
    numnota: e.numnota ?? "",
    numped: e.numped ?? "",
    codcli: e.codcli ?? "",
    cliente: e.cliente ?? "",
    bairroent: e.bairroent ?? "",
    municent: e.municent ?? "",
    destino: e.destino ?? "",
    totpeso: e.totpeso ?? "",
    placa: e.placa ?? "",
    praca: e.praca ?? "",
    uf: e.uf ?? "",
    data_prevista: e.data_prevista ?? "",
    data_realizada: e.data_realizada ?? "",
    status: e.status ?? "agendado",
    observacao: e.observacao ?? "",
    created_at: agora,
  }));

  await sheet.addRows(linhas);
  return linhas.length;
}

export async function atualizarStatus(id: string, status: StatusEntrega, dataRealizada?: string) {
  const sheet = await getSheet("entregas");
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get("id") === id);
  if (!row) throw new Error("Entrega não encontrada");

  row.set("status", status);
  if (dataRealizada) row.set("data_realizada", dataRealizada);
  await row.save();
}

export async function resumoIndicadores() {
  const entregas = await listarEntregas();

  const total = entregas.length;
  const entregues = entregas.filter((e) => e.status === "entregue").length;
  const atrasados = entregas.filter((e) => e.status === "atrasado").length;
  const fluvial = entregas.filter((e) => e.tipo === "fluvial").length;
  const rodoviario = entregas.filter((e) => e.tipo === "rodoviario").length;

  return { total, entregues, atrasados, fluvial, rodoviario };
}
