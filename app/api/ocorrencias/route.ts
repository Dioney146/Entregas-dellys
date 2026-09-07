import { NextRequest, NextResponse } from "next/server";
import { registrarOcorrencia } from "@/lib/ocorrencias";
import { atualizarStatus } from "@/lib/entregas";

export async function POST(req: NextRequest) {
  try {
    const dados = await req.json();

    if (!dados.entrega_id) {
      return NextResponse.json({ error: "entrega_id é obrigatório" }, { status: 400 });
    }

    const ocorrencia = await registrarOcorrencia(dados);
    await atualizarStatus(dados.entrega_id, "ocorrencia");

    return NextResponse.json({ ok: true, ocorrencia });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erro ao registrar ocorrência" }, { status: 500 });
  }
}
