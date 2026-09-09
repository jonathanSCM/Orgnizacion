export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    // Importar el entrypoint público (pdf-parse/index.js) dispara un bloque de "modo debug"
    // (`!module.parent`) que intenta leer un PDF de prueba interno y revienta con ENOENT
    // en contextos ESM/Next.js. Se importa el módulo interno directamente para evitarlo.
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const result = await pdfParse(buffer);
    return result.text;
  }

  // .md, .txt y cualquier otro texto plano
  return buffer.toString("utf-8");
}
