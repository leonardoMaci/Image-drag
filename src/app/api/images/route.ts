import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateDescription,
  validateMimeType,
  sanitizeText,
  MAX_DIMENSION,
} from "@/lib/validation";

export const runtime = "nodejs";

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 240;

/** GET /api/images — list all board images in grid order. */
export async function GET() {
  try {
    const images = await prisma.boardImage.findMany({
      orderBy: { position: "asc" },
    });
    return NextResponse.json({ data: images });
  } catch (err) {
    console.error("List images failed:", err);
    return NextResponse.json(
      { error: "Falha ao carregar as imagens." },
      { status: 500 }
    );
  }
}

/** POST /api/images — register a new board image from an uploaded URL. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const descCheck = validateDescription(body?.description);
    if (!descCheck.ok) {
      return NextResponse.json({ error: descCheck.error }, { status: 400 });
    }

    if (typeof body?.imageUrl !== "string" || body.imageUrl.length === 0) {
      return NextResponse.json(
        { error: "imageUrl é obrigatório." },
        { status: 400 }
      );
    }

    const mimeType = String(body?.mimeType ?? "image/png");
    const mimeCheck = validateMimeType(mimeType);
    if (!mimeCheck.ok) {
      return NextResponse.json({ error: mimeCheck.error }, { status: 400 });
    }

    let width = Number(body?.width) || DEFAULT_WIDTH;
    let height = Number(body?.height) || DEFAULT_HEIGHT;
    width = Math.min(Math.max(width, 1), MAX_DIMENSION);
    height = Math.min(Math.max(height, 1), MAX_DIMENSION);

    // Slots are sparse, so a new image fills the first gap rather than always
    // landing after the highest index.
    const taken = new Set(
      (
        await prisma.boardImage.findMany({ select: { position: true } })
      ).map((i) => i.position)
    );
    let position = 0;
    while (taken.has(position)) position++;

    const created = await prisma.boardImage.create({
      data: {
        imageUrl: body.imageUrl,
        thumbnailUrl: body.thumbnailUrl ?? null,
        originalFileName: String(body?.originalFileName ?? "image"),
        description: sanitizeText(String(body.description)),
        altText: body?.altText ? sanitizeText(String(body.altText)) : null,
        width,
        height,
        position,
        mimeType,
        fileSize: Number(body?.fileSize) || 0,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error("Create image failed:", err);
    return NextResponse.json(
      { error: "Falha ao salvar o registro da imagem." },
      { status: 500 }
    );
  }
}
