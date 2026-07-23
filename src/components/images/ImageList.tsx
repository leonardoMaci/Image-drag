"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditImageDialog } from "./EditImageDialog";
import { toast } from "@/stores/toast-store";
import { formatDate, truncate } from "@/lib/utils";
import {
  listImages,
  deleteImage,
  updateImage,
} from "@/services/image-service";
import type { BoardImage } from "@/types/board-image";

export function ImageList() {
  const [images, setImages] = useState<BoardImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BoardImage | null>(null);
  const [deleting, setDeleting] = useState<BoardImage | null>(null);

  const load = () => {
    setLoading(true);
    listImages()
      .then(setImages)
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Falha ao carregar.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteImage(deleting.id);
      setImages((prev) => prev.filter((i) => i.id !== deleting.id));
      toast.success("Imagem excluída.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir.");
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = async (changes: {
    description: string;
    altText: string;
  }) => {
    if (!editing) return;
    const updated = await updateImage(editing.id, changes);
    setImages((prev) =>
      prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
    );
    toast.success("Descrição atualizada.");
  };

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando imagens…</p>;
  }

  if (images.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
        <p className="mb-3 text-sm text-slate-500">
          Nenhuma imagem cadastrada ainda.
        </p>
        <Link href="/images/new">
          <Button>Adicionar imagem</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {images.map((img) => (
          <li key={img.id} className="flex items-center gap-4 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.thumbnailUrl ?? img.imageUrl}
              alt={img.altText ?? img.description}
              className="h-16 w-16 flex-shrink-0 rounded-md border border-slate-200 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={img.description}>
                {truncate(img.description, 80)}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {img.originalFileName} · {formatDate(img.createdAt)}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                ● Publicada no quadro
              </span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditing(img)}
              >
                Editar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleting(img)}
              >
                Excluir
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <EditImageDialog
        image={editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir imagem"
        message="Tem certeza de que deseja excluir esta imagem? Esta ação não poderá ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
