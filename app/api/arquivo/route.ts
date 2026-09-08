import { NextResponse } from "next/server";
import { listarArquivo } from "@/lib/arquivo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const registros = await listarArquivo();
    return NextResponse.json(registros);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erro ao carregar arquivo" }, { status: 500 });
  }
}
