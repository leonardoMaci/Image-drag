import type {
  BoardImage,
  UpdateBoardImageInput,
  CreateBoardImageInput,
  SlotAssignment,
} from "@/types/board-image";

async function parse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (json && (json.error as string)) ??
      `Erro ${res.status} ao comunicar com o servidor.`;
    throw new Error(message);
  }
  return json as T;
}

export async function listImages(): Promise<BoardImage[]> {
  const res = await fetch("/api/images", { cache: "no-store" });
  const json = await parse<{ data: BoardImage[] }>(res);
  return json.data;
}

export async function createImage(
  input: CreateBoardImageInput
): Promise<BoardImage> {
  const res = await fetch("/api/images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await parse<{ data: BoardImage }>(res);
  return json.data;
}

/** Persists slot assignments after a drag (one item moved, or two swapped). */
export async function updatePositions(
  items: SlotAssignment[]
): Promise<BoardImage[]> {
  const res = await fetch("/api/images/positions", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const json = await parse<{ data: BoardImage[] }>(res);
  return json.data;
}

export async function updateImage(
  id: string,
  changes: UpdateBoardImageInput
): Promise<BoardImage> {
  const res = await fetch(`/api/images/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  const json = await parse<{ data: BoardImage }>(res);
  return json.data;
}

export async function deleteImage(id: string): Promise<void> {
  const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
  await parse<{ data: { id: string } }>(res);
}
