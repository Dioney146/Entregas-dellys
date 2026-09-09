import { getSheet } from "./sheets";
import { Ocorrencia } from "./types";

function formatarDataHoraBr(d: Date): string {
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dia}/${mes}/${ano} ${hh}:${mm}:${ss}`;
}

export async function registrarOcorrencia(dados: Partial<Ocorrencia>) {
  const sheet = await getSheet("ocorrencias");
  const agora = formatarDataHoraBr(new Date());

  const linha = {
    id: crypto.randomUUID(),
    entrega_id: dados.entrega_id ?? "",
    carregamento: dados.carregamento ?? "",
    numnota: dados.numnota ?? "",
    cliente: dados.cliente ?? "",
    codcli: dados.codcli ?? "",
    placa: dados.placa ?? "",
    destino: dados.destino ?? "",
    obs: dados.obs ?? "",
    created_at: agora,
    produtos_falta: dados.produtos_falta ?? "",
  };

  await sheet.addRow(linha);
  return linha;
}
