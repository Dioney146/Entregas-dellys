"use client";

import { useEffect, useState } from "react";

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

const STATUS_LABEL: Record<string, { label: string; cor: string }> = {
  agendado: { label: "Agendado", cor: "bg-slate-600" },
  entregue: { label: "Entregue", cor: "bg-emerald-600" },
  ocorrencia: { label: "Ocorrência", cor: "bg-amber-600" },
  nao_entregue: { label: "Não entregue", cor: "bg-red-600" },
};

export default function EntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("");

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Entregas</h2>
        <select
          className="bg-slate-800 rounded-lg p-2 text-sm"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="agendado">Agendado</option>
          <option value="entregue">Entregue</option>
          <option value="ocorrencia">Ocorrência</option>
          <option value="nao_entregue">Não entregue</option>
        </select>
      </div>

      {erro && (
        <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm rounded-lg p-3">
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="text-slate-400 text-sm">Carregando...</p>
      ) : (
        <div className="bg-slate-800 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700 text-left">
              <tr>
                <th className="p-3">Tipo</th>
                <th className="p-3">Carregamento</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Destino</th>
                <th className="p-3">Previsão</th>
                <th className="p-3">Status</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {entregas.map((e) => (
                <tr key={e.id} className="border-t border-slate-700">
                  <td className="p-3 capitalize">{e.tipo}{e.modal ? ` (${e.modal})` : ""}</td>
                  <td className="p-3">{e.numcar ?? "-"}</td>
                  <td className="p-3">{e.cliente ?? "-"}</td>
                  <td className="p-3">{e.destino ?? e.municent ?? "-"}</td>
                  <td className="p-3">{e.data_prevista ?? "-"}</td>
                  <td className="p-3">
                    <span className={`text-xs rounded-full px-2 py-1 text-white ${STATUS_LABEL[e.status]?.cor ?? "bg-slate-600"}`}>
                      {STATUS_LABEL[e.status]?.label ?? e.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button
                        disabled={salvandoId === e.id}
                        onClick={() => marcarStatus(e.id, "entregue")}
                        className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs rounded-lg px-2 py-1"
                      >
                        Entregue
                      </button>
                      <button
                        disabled={salvandoId === e.id}
                        onClick={() => abrirModalOcorrencia(e)}
                        className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white text-xs rounded-lg px-2 py-1"
                      >
                        Ocorrência
                      </button>
                      <button
                        disabled={salvandoId === e.id}
                        onClick={() => marcarStatus(e.id, "nao_entregue")}
                        className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs rounded-lg px-2 py-1"
                      >
                        Não entregue
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {entregas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    Nenhuma entrega encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalEntrega && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold">Registrar ocorrência</h3>

            <div className="text-sm text-slate-300 space-y-1">
              <p><span className="text-slate-500">Carregamento:</span> {modalEntrega.numcar ?? "-"}</p>
              <p><span className="text-slate-500">Nota fiscal:</span> {modalEntrega.numnota ?? "-"}</p>
              <p><span className="text-slate-500">Cliente:</span> {modalEntrega.cliente ?? "-"}</p>
              <p><span className="text-slate-500">Código cliente:</span> {modalEntrega.codcli ?? "-"}</p>
              <p><span className="text-slate-500">Placa:</span> {modalEntrega.placa ?? "-"}</p>
              <p><span className="text-slate-500">Destino:</span> {modalEntrega.destino ?? modalEntrega.municent ?? "-"}</p>
            </div>

            <label className="block text-sm">
              Observação da ocorrência
              <textarea
                className="mt-1 w-full bg-slate-700 rounded-lg p-2 text-sm"
                rows={4}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Descreva o que aconteceu..."
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalEntrega(null)}
                className="px-4 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={enviarOcorrencia}
                disabled={enviandoOcorrencia}
                className="px-4 py-2 text-sm rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
              >
                {enviandoOcorrencia ? "Salvando..." : "Salvar ocorrência"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
