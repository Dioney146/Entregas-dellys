import { NextRequest, NextResponse } from "next/server";
import { atualizarStatus, listarEntregas } from "@/lib/entregas";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  try {
    const entregas = await listarEntregas({
      tipo: tipo as any,
      status: status as any,
    });
    return NextResponse.json(entregas);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, data_realizada } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "id e status são obrigatórios" }, { status: 400 });
    }
    await atualizarStatus(id, status, data_realizada);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
