import { getSheet } from "./sheets";
import { Ocorrencia } from "./types";

function formatarDataHoraBr(d: Date): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Manaus",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const partes = formatter.formatToParts(d);
  const obter = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${obter("day")}/${obter("month")}/${obter("year")} ${obter("hour")}:${obter("minute")}:${obter("second")}`;
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
