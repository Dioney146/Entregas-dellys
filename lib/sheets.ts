import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

function getAuth() {
  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function getDoc() {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID as string, getAuth());
  await doc.loadInfo();
  return doc;
}

export async function getSheet(nome: "entregas" | "cronograma" | "ocorrencias") {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle[nome];
  if (!sheet) throw new Error(`Aba "${nome}" não encontrada na planilha.`);
  return sheet;
}
