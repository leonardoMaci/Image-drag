import { NextRequest, NextResponse } from "next/server";
import { saveFile } from "@/lib/storage";
import {
  validateExtension,
  validateMimeType,
  validateSize,
  sniffImageType,
} from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/upload  (multipart/form-data, field: "file")
 * Validates and stores the binary, returns the public URL + metadata.
 * The client then calls POST /api/images to register the board record.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    const extCheck = validateExtension(file.name);
    if (!extCheck.ok) {
      return NextResponse.json({ error: extCheck.error }, { status: 400 });
    }

    const mimeCheck = validateMimeType(file.type);
    if (!mimeCheck.ok) {
      return NextResponse.json({ error: mimeCheck.error }, { status: 400 });
    }

    const sizeCheck = validateSize(file.size);
    if (!sizeCheck.ok) {
      return NextResponse.json({ error: sizeCheck.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Verify the real content matches an accepted image type (magic bytes).
    const sniffed = sniffImageType(buffer);
    if (!sniffed) {
      return NextResponse.json(
        { error: "Arquivo inválido ou corrompido: não é uma imagem válida." },
        { status: 400 }
      );
    }

    const saved = await saveFile(buffer, sniffed);

    return NextResponse.json({
      imageUrl: saved.url,
      originalFileName: file.name,
      mimeType: sniffed,
      fileSize: file.size,
    });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json(
      { error: "Falha ao enviar o arquivo. Tente novamente." },
      { status: 500 }
    );
  }
}
