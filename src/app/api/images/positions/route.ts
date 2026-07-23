import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Assignment = { id: string; position: number };

class SlotConflictError extends Error {}

/**
 * PATCH /api/images/positions — assign images to board slots.
 *
 * Slots are sparse: an image sits at an absolute index and the gaps between
 * them are real empty cells. A drag sends one assignment (moved to a free
 * slot) or two (swapped with the image already there).
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const items: unknown = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Posições inválidas." },
        { status: 400 }
      );
    }

    const assignments: Assignment[] = [];
    for (const item of items) {
      const id = (item as Assignment)?.id;
      const position = (item as Assignment)?.position;
      if (
        typeof id !== "string" ||
        id.length === 0 ||
        !Number.isInteger(position) ||
        position < 0
      ) {
        return NextResponse.json(
          { error: "Posições inválidas." },
          { status: 400 }
        );
      }
      assignments.push({ id, position });
    }

    const ids = assignments.map((a) => a.id);
    if (new Set(ids).size !== ids.length) {
      return NextResponse.json(
        { error: "Posições inválidas: imagem repetida." },
        { status: 400 }
      );
    }
    const targets = assignments.map((a) => a.position);
    if (new Set(targets).size !== targets.length) {
      return NextResponse.json(
        { error: "Posições inválidas: dois itens no mesmo slot." },
        { status: 400 }
      );
    }

    const known = await prisma.boardImage.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    if (known.length !== ids.length) {
      return NextResponse.json(
        { error: "Imagem não encontrada." },
        { status: 404 }
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        for (const { id, position } of assignments) {
          await tx.boardImage.update({ where: { id }, data: { position } });
        }
        // A half-applied swap would leave two images in one slot; roll back
        // rather than persist a board that can't be rendered.
        const all = await tx.boardImage.findMany({ select: { position: true } });
        const seen = new Set(all.map((i) => i.position));
        if (seen.size !== all.length) {
          throw new SlotConflictError();
        }
      });
    } catch (err) {
      if (err instanceof SlotConflictError) {
        return NextResponse.json(
          { error: "Slot já ocupado por outra imagem." },
          { status: 409 }
        );
      }
      throw err;
    }

    const images = await prisma.boardImage.findMany({
      orderBy: { position: "asc" },
    });
    return NextResponse.json({ data: images });
  } catch (err) {
    console.error("Update positions failed:", err);
    return NextResponse.json(
      { error: "Falha ao salvar as posições." },
      { status: 500 }
    );
  }
}
