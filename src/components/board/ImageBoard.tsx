"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useBoardStore } from "@/stores/board-store";
import { toast } from "@/stores/toast-store";
import {
  listImages,
  updatePositions as persistPositions,
  updateImage,
  deleteImage,
} from "@/services/image-service";
import type { SlotAssignment } from "@/types/board-image";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditImageDialog } from "@/components/images/EditImageDialog";
import { BoardGrid } from "./BoardGrid";
import { ImageActionMenu } from "./ImageActionMenu";
import { GRID_COLUMNS } from "./board-constants";

export function ImageBoard() {
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    images,
    selectedImageId,
    setImages,
    selectImage,
    applyPositions,
    updateImage: updateImageLocal,
    removeImage,
    getImage,
    getImageAt,
  } = useBoardStore();

  const selectedImage = selectedImageId ? getImage(selectedImageId) : undefined;

  // --- Load images once ---
  useEffect(() => {
    let active = true;
    listImages()
      .then((data) => {
        if (active) setImages(data);
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Falha ao carregar.")
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [setImages]);

  // --- Drop into a slot, with optimistic update + rollback ---
  const handleDropInSlot = useCallback(
    (id: string, position: number) => {
      const moved = getImage(id);
      if (!moved || moved.position === position) return;

      // Occupied target: the two images trade slots. Empty target: just move.
      const occupant = getImageAt(position);
      const next: SlotAssignment[] = occupant
        ? [
            { id, position },
            { id: occupant.id, position: moved.position },
          ]
        : [{ id, position }];
      const previous: SlotAssignment[] = next.map((a) => ({
        id: a.id,
        position: a.id === id ? moved.position : position,
      }));

      const commit = () => {
        applyPositions(next);
        persistPositions(next).catch(() => {
          applyPositions(previous);
          toast.error("Não foi possível salvar a nova posição.", {
            label: "Tentar novamente",
            onClick: commit,
          });
        });
      };
      commit();
    },
    [getImage, getImageAt, applyPositions]
  );

  const handleSaveDescription = useCallback(
    async (changes: { description: string; altText: string }) => {
      if (!selectedImage) return;
      const updated = await updateImage(selectedImage.id, changes);
      updateImageLocal(updated.id, {
        description: updated.description,
        altText: updated.altText,
      });
      toast.success("Descrição atualizada.");
    },
    [selectedImage, updateImageLocal]
  );

  const handleDelete = useCallback(async () => {
    if (!selectedImage) return;
    const id = selectedImage.id;
    try {
      await deleteImage(id);
      removeImage(id);
      setConfirmOpen(false);
      toast.success("Imagem excluída.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir.");
    }
  }, [selectedImage, removeImage]);

  return (
    <div className="relative flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">
            {images.length} {images.length === 1 ? "imagem" : "imagens"}
          </span>
          <span className="hidden text-xs text-slate-400 sm:inline">
            {GRID_COLUMNS} por linha · arraste para mover ou trocar
          </span>
        </div>
        <Link href="/images">
          <Button size="sm">Gerenciar imagens</Button>
        </Link>
      </div>

      {/* Board area */}
      <div className="relative min-h-0 flex-1">
        <BoardGrid
          images={images}
          selectedId={selectedImageId}
          onSelect={selectImage}
          onDeselect={() => selectImage(null)}
          onDropInSlot={handleDropInSlot}
          renderActions={() => (
            <ImageActionMenu
              onEdit={() => setEditOpen(true)}
              onDelete={() => setConfirmOpen(true)}
            />
          )}
        />

        {loading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Carregando quadro…
          </div>
        )}

        {!loading && images.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-slate-400">
            <p className="text-sm">Nenhuma imagem no quadro ainda.</p>
            <Link href="/images/new" className="pointer-events-auto">
              <Button size="sm">Adicionar a primeira imagem</Button>
            </Link>
          </div>
        )}
      </div>

      <EditImageDialog
        image={selectedImage ?? null}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveDescription}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir imagem"
        message="Tem certeza de que deseja excluir esta imagem? Esta ação não poderá ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
