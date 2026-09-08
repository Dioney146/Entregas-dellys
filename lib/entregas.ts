import { getSheet } from "./sheets";
import { Entrega, StatusEntrega, TipoEntrega } from "./types";

function linhaParaEntrega(row: any, tipoFallback: TipoEntrega): Entrega {
  return {
    id: row.get("id"),
    tipo: (row.get("tipo") || tipoFallback) as TipoEntrega,
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
    uf: null,
    data_prevista: row.get("data_prevista") || null,
    data_realizada: row.get("data_realizada") || null,
    status: (row.get("status") || "agendado") as StatusEntrega,
    observacao: null,
    created_at: row.get("created_at") || "",
  };
}

export interface FiltrosEntrega {
  tipo?: TipoEntrega;
  status?: StatusEntrega;
  praca?: string;
}

export async function listarEntregas(filtros: FiltrosEntrega = {}) {
  let entregas: Entrega[] = [];

  if (!filtros.tipo || filtros.tipo === "rodoviario") {
    const sheetRodo = await getSheet("Rodoviario");
    const rowsRodo = await sheetRodo.getRows();
    entregas = entregas.concat(rowsRodo.map((r) => linhaParaEntrega(r, "rodoviario")));
  }

  if (!filtros.tipo || filtros.tipo === "fluvial") {
    const sheetFluvial = await getSheet("Fluvial");
    const rowsFluvial = await sheetFluvial.getRows();
    entregas = entregas.concat(rowsFluvial.map((r) => linhaParaEntrega(r, "fluvial")));
  }

  if (filtros.status) entregas = entregas.filter((e) => e.status === filtros.status);
  if (filtros.praca) entregas = entregas.filter((e) => e.praca === filtros.praca);

  return entregas;
}

export async function atualizarStatus(id: string, status: StatusEntrega, dataRealizada?: string) {
  const sheetRodo = await getSheet("Rodoviario");
  const rowsRodo = await sheetRodo.getRows();
  const rowRodo = rowsRodo.find((r) => r.get("id") === id);

  if (rowRodo) {
    rowRodo.set("status", status);
    if (dataRealizada) rowRodo.set("data_realizada", dataRealizada);
    await rowRodo.save();
    return;
  }

  const sheetFluvial = await getSheet("Fluvial");
  const rowsFluvial = await sheetFluvial.getRows();
  const rowFluvial = rowsFluvial.find((r) => r.get("id") === id);

  if (rowFluvial) {
    rowFluvial.set("status", status);
    if (dataRealizada) rowFluvial.set("data_realizada", dataRealizada);
    await rowFluvial.save();
    return;
  }

  throw new Error("Entrega não encontrada");
}

export async function resumoIndicadores() {
  const entregas = await listarEntregas();

  const total = entregas.length;
  const entregues = entregas.filter((d) => d.status === "entregue").length;
  const ocorrencias = entregas.filter((d) => d.status === "ocorrencia").length;
  const naoEntregues = entregas.filter((d) => d.status === "nao_entregue").length;
  const fluvial = entregas.filter((d) => d.tipo === "fluvial").length;
  const rodoviario = entregas.filter((d) => d.tipo === "rodoviario").length;

  return { total, entregues, ocorrencias, naoEntregues, fluvial, rodoviario };
}
