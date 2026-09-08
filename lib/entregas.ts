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
    data_realizada: row.get("data_realizada") || null,
    status: (row.get("status") || "agendado") as StatusEntrega,
    created_at: row.get("created_at") || "",
  };
}

export interface FiltrosEntrega {
  tipo?: TipoEntrega;
  status?: StatusEntrega;
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

  return entregas;
}

function formatarDataHoraBr(d: Date): string {
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dia}/${mes}/${ano} ${hh}:${mm}:${ss}`;
}

async function arquivarLinha(row: any, tipoFallback: TipoEntrega) {
  const arquivoSheet = await getSheet("arquivo");

  await arquivoSheet.addRow({
    id: row.get("id") || "",
    tipo: row.get("tipo") || tipoFallback,
    modal: row.get("modal") || "",
    numcar: row.get("numcar") || "",
    numnota: row.get("numnota") || "",
    numped: row.get("numped") || "",
    codcli: row.get("codcli") || "",
    cliente: row.get("cliente") || "",
    bairroent: row.get("bairroent") || "",
    municent: row.get("municent") || "",
    destino: row.get("destino") || "",
    totpeso: row.get("totpeso") || "",
    placa: row.get("placa") || "",
    status: row.get("status") || "",
    data_realizada: row.get("data_realizada") || "",
    created_at: row.get("created_at") || "",
    arquivado_em: formatarDataHoraBr(new Date()),
  });

  await row.delete();
}

export async function atualizarStatus(id: string, status: StatusEntrega, dataRealizada?: string) {
  const sheetRodo = await getSheet("Rodoviario");
  const rowsRodo = await sheetRodo.getRows();
  const rowRodo = rowsRodo.find((r) => r.get("id") === id);

  if (rowRodo) {
    rowRodo.set("status", status);
    if (dataRealizada) rowRodo.set("data_realizada", dataRealizada);
    await rowRodo.save();
    if (status !== "agendado") {
      await arquivarLinha(rowRodo, "rodoviario");
    }
    return;
  }

  const sheetFluvial = await getSheet("Fluvial");
  const rowsFluvial = await sheetFluvial.getRows();
  const rowFluvial = rowsFluvial.find((r) => r.get("id") === id);

  if (rowFluvial) {
    rowFluvial.set("status", status);
    if (dataRealizada) rowFluvial.set("data_realizada", dataRealizada);
    await rowFluvial.save();
    if (status !== "agendado") {
      await arquivarLinha(rowFluvial, "fluvial");
    }
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
