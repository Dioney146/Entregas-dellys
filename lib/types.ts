export type TipoEntrega = "fluvial" | "rodoviario";
export type StatusEntrega =
  | "agendado"
  | "em_transito"
  | "entregue"
  | "atrasado"
  | "cancelado";

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
  praca: string | null;
  uf: string | null;
  data_prevista: string | null;
  data_realizada: string | null;
  status: StatusEntrega;
  observacao: string | null;
  created_at: string;
}
