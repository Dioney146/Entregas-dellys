"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Clock,
  TriangleAlert,
} from "lucide-react";
import { RodoviarioArt, FluvialArt } from "./illustrations";

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
  data_prevista: string | null;
  status: "agendado" | "entregue" | "ocorrencia" | "nao_entregue";
}

type ModalidadeFiltro = "rodoviario" | "fluvial";

interface StatusInfo {
  label: string;
  cor: string;
  bg: string;
  borda: string;
}

const STATUS_LABEL: { [chave: string]: StatusInfo } = {
  agendado: {
    label: "Agendado",
    cor: "var(--status-agendado)",
    bg: "rgba(100,116,139,0.15)",
    borda: "rgba(100,116,139,0.35)",
  },
  entregue: {
    label: "Entregue",
    cor: "var(--status-entregue)",
    bg: "rgba(52,211,153,0.15)",
    borda: "rgba(52,211,153,0.35)",
  },
  ocorrencia: {
    label: "Ocorrência",
    cor: "var(--status-ocorrencia)",
    bg: "rgba(245,165,36,0.15)",
    borda: "rgba(245,165,36,0.35)",
  },
  nao_entregue: {
    label: "Não entregue",
    cor: "var(--status-nao-entregue)",
    bg: "rgba(240,82,107,0.15)",
    borda: "rgba(240,82,107,0.35)",
  },
};

export default function EntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [modalidade, setModalidade] = useState<ModalidadeFiltro>("rodoviario");

  const [modalEntrega, setModalEntrega] = useState<Entrega | null>(null);
  const [obs, setObs] = useState("");
  const [enviandoOcorrencia, setEnviandoOcorrencia] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const url = filtroStatus ? `/api/entregas?status=${filtroStatus}` : "/api/entregas";
      const resp = await fetch(url);
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "Erro ao carregar entregas");
      setEntregas(json);
    } catch (e: any) {
      setErro(e.message ?? "Erro ao carregar entregas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus]);

  const entregasPorModalidade = useMemo(() => {
    return entregas.filter((e) => e.tipo === modalidade);
  }, [entregas, modalidade]);

  const entregasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return entregasPorModalidade;

    return entregasPorModalidade.filter((e) => {
      const campos = [e.cliente, e.numnota, e.numcar, e.placa, e.destino, e.municent, e.codcli];
      return campos.some((campo) => (campo ?? "").toLowerCase().includes(termo));
    });
  }, [entregasPorModalidade, busca]);

  const indicadores = useMemo(() => {
    const total = entregasPorModalidade.length;
    const entregues = entregasPorModalidade.filter((e) => e.status === "entregue").length;
    const pendentes = entregasPorModalidade.filter((e) => e.status === "agendado").length;
    const ocorrencias = entregasPorModalidade.filter((e) => e.status === "ocorrencia").length;
    return { total, entregues, pendentes, ocorrencias };
  }, [entregasPorModalidade]);

  const totalRodoviario = entregas.filter((e) => e.tipo === "rodoviario").length;
  const totalFluvial = entregas.filter((e) => e.tipo === "fluvial").length;

  async function marcarStatus(id: string, status: "entregue" | "nao_entregue") {
    setSalvandoId(id);
    try {
      const dataRealizada = new Date().toISOString().split("T")[0];
      const resp = await fetch("/api/entregas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, data_realizada: dataRealizada }),
      });
      if (!resp.ok) {
        const json = await resp.json();
        throw new Error(json.error ?? "Erro ao atualizar status");
      }
      setEntregas((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    } catch (e: any) {
      alert(e.message ?? "Erro ao atualizar status");
    } finally {
      setSalvandoId(null);
    }
  }

  function abrirModalOcorrencia(entrega: Entrega) {
    setModalEntrega(entrega);
    setObs("");
  }

  async function enviarOcorrencia() {
    if (!modalEntrega) return;
    setEnviandoOcorrencia(true);
    try {
      const resp = await fetch("/api/ocorrencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entrega_id: modalEntrega.id,
          carregamento: modalEntrega.numcar,
          numnota: modalEntrega.numnota,
          cliente: modalEntrega.cliente,
          codcli: modalEntrega.codcli,
          placa: modalEntrega.placa,
          destino: modalEntrega.destino ?? modalEntrega.municent,
          obs,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "Erro ao registrar ocorrência");

      setEntregas((prev) =>
        prev.map((e) => (e.id === modalEntrega.id ? { ...e, status: "ocorrencia" } : e))
      );
      setModalEntrega(null);
    } catch (e: any) {
      alert(e.message ?? "Erro ao registrar ocorrência");
    } finally {
      setEnviandoOcorrencia(false);
    }
  }

  const tileRodoviario = {
    valor: "rodoviario" as ModalidadeFiltro,
    titulo: "Rodoviário",
    subtitulo: "Entregas por estrada",
    total: totalRodoviario,
    accent: "var(--accent-rodo)",
  };
  const tileFluvial = {
    valor: "fluvial" as ModalidadeFiltro,
