import { getSheet } from "./sheets";

export interface RegistroArquivo {
  id: string;
  tipo: string;
  modal: string | null;
  numcar: string | null;
  numnota: string | null;
  numped: string | null;
  codcli: string | null;
  cliente: string | null;
  bairroent: string | null;
  municent: string | null;
  destino: string | null;
  totpeso: string | null;
  placa: string | null;
  status: string;
  data_realizada: string | null;
  created_at: string;
  arquivado_em: string;
}

export async function listarArquivo() {
  const sheet = await getSheet("arquivo");
  const rows = await sheet.getRows();

  return rows.map((row): RegistroArquivo => ({
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
    status: row.get("status") || "",
    data_realizada: row.get("data_realizada") || null,
    created_at: row.get("created_at") || "",
    arquivado_em: row.get("arquivado_em") || "",
  }));
}
