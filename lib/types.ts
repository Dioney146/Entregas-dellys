export type TipoEntrega = "fluvial" | "rodoviario";
export type StatusEntrega = "agendado" | "entregue" | "ocorrencia" | "nao_entregue";

export interface Entrega {
  id: string;
  tipo: TipoEntrega;
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
  data_realizada: string | null;
  status: StatusEntrega;
  created_at: string;
}

export interface Ocorrencia {
  id: string;
  entrega_id: string;
  carregamento: string | null;
  numnota: string | null;
  cliente: string | null;
  codcli: string | null;
  placa: string | null;
  destino: string | null;
  obs: string | null;
  created_at: string;
}
