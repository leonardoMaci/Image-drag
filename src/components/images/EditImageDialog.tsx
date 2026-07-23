"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/field";
import type { BoardImage } from "@/types/board-image";

interface Props {
  image: BoardImage | null;
  open: boolean;
  onClose: () => void;
  onSave: (changes: {
    description: string;
    altText: string;
  }) => Promise<void>;
}

export function EditImageDialog({ image, open, onClose, onSave }: Props) {
  const [description, setDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (image) {
      setDescription(image.description);
      setAltText(image.altText ?? "");
      setError(null);
    }
  }, [image]);

  if (!image) return null;

  const handleSave = async () => {
    if (description.trim().length === 0) {
      setError("A descrição é obrigatória.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ description: description.trim(), altText: altText.trim() });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Editar descrição">
      <div className="space-y-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.imageUrl}
          alt={image.altText ?? image.description}
          className="max-h-40 w-full rounded-md object-contain bg-slate-100"
        />

        <div>
          <Label htmlFor="edit-description">Descrição *</Label>
          <Textarea
            id="edit-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="edit-alt">Texto alternativo</Label>
          <Input
            id="edit-alt"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
