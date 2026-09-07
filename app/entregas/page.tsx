"use client";

import { useEffect, useState } from "react";

type StatusEntrega = "agendado" | "em_transito" | "entregue" | "atrasado" | "cancelado";

interface Entrega {
  id: string;
  tipo: string;
  modal: string | null;
  numcar: string | null;
  cliente: string | null;
  destino: string | null;
  municent: string | null;
  data_prevista: string | null;
  status: StatusEntrega;
}

const STATUS_OPCOES: { valor: StatusEntrega; label: string; cor: string }[] = [
  { valor: "agendado", label: "Agendado", cor: "bg-slate-600" },
  { valor: "em_transito", label: "Em trânsito", cor: "bg-blue-600" },
  { valor: "entregue", label: "Entregue", cor: "bg-emerald-600" },
  { valor: "atrasado", label: "Atrasado", cor: "bg-red-600" },
  { valor: "cancelado", label: "Cancelado", cor: "bg-slate-500" },
];

export default function EntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("");

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

  async function mudarStatus(id: string, novoStatus: StatusEntrega) {
    setSalvandoId(id);
    try {
      const dataRealizada =
        novoStatus === "entregue" ? new Date().toISOString().split("T")[0] : undefined;

      const resp = await fetch("/api/entregas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: novoStatus, data_realizada: dataRealizada }),
      });

      if (!resp.ok) {
        const json = await resp.json();
        throw new Error(json.error ?? "Erro ao atualizar status");
      }

      setEntregas((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: novoStatus } : e))
      );
    } catch (e: any) {
      alert(e.message ?? "Erro ao atualizar status");
    } finally {
      setSalvandoId(null);
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
          {STATUS_OPCOES.map((s) => (
            <option key={s.valor} value={s.valor}>{s.label}</option>
          ))}
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
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-700 text-left">
              <tr>
                <th className="p-3">Tipo</th>
                <th className="p-3">Carregamento</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Destino</th>
                <th className="p-3">Previsão</th>
                <th className="p-3">Status</th>
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
                    <select
                      className={`text-xs rounded-full px-2 py-1 border-none text-white ${
                        STATUS_OPCOES.find((s) => s.valor === e.status)?.cor ?? "bg-slate-600"
                      }`}
                      value={e.status}
                      disabled={salvandoId === e.id}
                      onChange={(ev) => mudarStatus(e.id, ev.target.value as StatusEntrega)}
                    >
                      {STATUS_OPCOES.map((s) => (
                        <option key={s.valor} value={s.valor} className="text-black">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {entregas.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Nenhuma entrega encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
