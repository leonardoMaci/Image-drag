import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";
import { validateDescription, sanitizeText } from "@/lib/validation";

export const runtime = "nodejs";

type Params = { params: { id: string } };

/** PATCH /api/images/:id — update description / altText. */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();

    if (body?.description !== undefined) {
      const check = validateDescription(body.description);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
    }

    const data: { description?: string; altText?: string | null } = {};
    if (body?.description !== undefined) {
      data.description = sanitizeText(String(body.description));
    }
    if (body?.altText !== undefined) {
      data.altText = body.altText ? sanitizeText(String(body.altText)) : null;
    }

    const updated = await prisma.boardImage.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    if (isNotFound(err)) {
      return NextResponse.json(
        { error: "Imagem não encontrada." },
        { status: 404 }
      );
    }
    console.error("Update image failed:", err);
    return NextResponse.json(
      { error: "Falha ao atualizar a descrição." },
      { status: 500 }
    );
  }
}

/** DELETE /api/images/:id — remove record and stored file. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const image = await prisma.boardImage.findUnique({
      where: { id: params.id },
    });
    if (!image) {
      return NextResponse.json(
        { error: "Imagem não encontrada." },
        { status: 404 }
      );
    }

    await prisma.boardImage.delete({ where: { id: params.id } });

    // Best-effort file cleanup; a storage failure should not fail the request
    // since the DB record (source of truth) is already gone.
    try {
      await deleteFile(image.imageUrl);
    } catch (fileErr) {
      console.warn("Could not delete stored file:", fileErr);
    }

    return NextResponse.json({ data: { id: params.id } });
  } catch (err) {
    if (isNotFound(err)) {
      return NextResponse.json(
        { error: "Imagem não encontrada." },
        { status: 404 }
      );
    }
    console.error("Delete image failed:", err);
    return NextResponse.json(
      { error: "Falha ao excluir a imagem." },
      { status: 500 }
    );
  }
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2025"
  );
}
