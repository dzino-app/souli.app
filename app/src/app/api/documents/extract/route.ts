import { NextRequest, NextResponse } from "next/server";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "Žiadny súbor nebol nahraný" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Súbor je príliš veľký (max. 10 MB)" },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (file.type === "application/pdf") {
      // Extract text from PDF using basic approach
      // Full PDF parsing (pdfjs-dist) is too heavy for webpack bundling
      // In production, use a microservice or edge function for PDF extraction
      text = extractTextFromPdfBuffer(buffer);
      if (!text.trim()) {
        text = `[PDF dokument: ${file.name} — text sa nepodarilo extrahovať. Skúste DOCX alebo textový súbor.]`;
      }
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // DOCX files are ZIP archives with XML content
      text = extractTextFromDocxBuffer(buffer);
      if (!text.trim()) {
        text = `[DOCX dokument: ${file.name}]`;
      }
    } else if (file.type.startsWith("image/")) {
      text = `[Obrázok: ${file.name}]`;
    } else {
      text = buffer.toString("utf-8");
    }

    // Truncate very long documents to avoid token limits
    const maxChars = 50000;
    if (text.length > maxChars) {
      text = text.slice(0, maxChars) + "\n\n[... dokument bol skrátený ...]";
    }

    return NextResponse.json({ text, filename: file.name });
  } catch {
    return NextResponse.json(
      { error: "Nepodarilo sa spracovať súbor" },
      { status: 500 }
    );
  }
}

// Basic PDF text extraction by finding text streams in the raw buffer
// This is a lightweight fallback — works for most text-based PDFs
function extractTextFromPdfBuffer(buffer: Buffer): string {
  const content = buffer.toString("latin1");
  const texts: string[] = [];

  // Find text between BT (begin text) and ET (end text) operators
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = btEtRegex.exec(content)) !== null) {
    const block = match[1];
    // Extract text from Tj and TJ operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      texts.push(tjMatch[1]);
    }
    // TJ array operator
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
      const items = tjArrMatch[1];
      const strRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = strRegex.exec(items)) !== null) {
        texts.push(strMatch[1]);
      }
    }
  }

  return texts
    .map((t) => decodePdfString(t))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodePdfString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

// Basic DOCX text extraction — DOCX is a ZIP file containing XML
function extractTextFromDocxBuffer(buffer: Buffer): string {
  // Look for the document.xml content in the ZIP
  // DOCX uses PK zip format
  const content = buffer.toString("utf-8");

  // Extract text from XML tags — simple regex approach
  // Find all <w:t> tags (Word text runs)
  const texts: string[] = [];
  const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match;
  while ((match = wtRegex.exec(content)) !== null) {
    texts.push(match[1]);
  }

  if (texts.length > 0) {
    return texts.join(" ");
  }

  // Fallback: try to extract any readable text
  return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 10000);
}
