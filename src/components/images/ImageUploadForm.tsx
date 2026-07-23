"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/field";
import { ImagePreview } from "./ImagePreview";
import { uploadFile, readImageDimensions } from "@/services/upload-service";
import { createImage } from "@/services/image-service";
import { toast } from "@/stores/toast-store";
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/validation";

export function ImageUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(
    null
  );
  const [description, setDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    // Client-side validation (mirrored on the server).
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXTENSIONS.includes(ext as (typeof ACCEPTED_EXTENSIONS)[number])) {
      setError("Formato não suportado. Use JPG, PNG ou WebP.");
      return;
    }
    if (!ACCEPTED_MIME_TYPES.includes(f.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
      setError("Tipo de arquivo não suportado.");
      return;
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError(
        `Arquivo acima do limite de ${(MAX_FILE_SIZE_BYTES / 1048576).toFixed(0)} MB.`
      );
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    try {
      const d = await readImageDimensions(f);
      setDims(d);
    } catch {
      setDims(null);
    }
  };

  const resolveDimensions = () => {
    const w = Number(customWidth) || dims?.width || 320;
    const h = Number(customHeight) || dims?.height || 240;
    // Cap the on-board size so large photos don't dominate the canvas,
    // preserving aspect ratio.
    const MAX_INITIAL = 360;
    if (w > MAX_INITIAL || h > MAX_INITIAL) {
      const ratio = Math.min(MAX_INITIAL / w, MAX_INITIAL / h);
      return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
    }
    return { width: w, height: h };
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Selecione uma imagem.");
      return;
    }
    if (description.trim().length === 0) {
      setError("A descrição é obrigatória.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload binary to storage.
      const uploaded = await uploadFile(file);
      // 2. Register the board record.
      const { width, height } = resolveDimensions();
      await createImage({
        imageUrl: uploaded.imageUrl,
        originalFileName: uploaded.originalFileName,
        mimeType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
        description: description.trim(),
        altText: altText.trim() || null,
        width,
        height,
      });
      toast.success("Imagem publicada no quadro.");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao publicar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <Label htmlFor="file">Arquivo de imagem *</Label>
        <input
          id="file"
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPickFile}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white hover:file:bg-blue-700"
        />
        <p className="mt-1 text-xs text-slate-400">
          JPG, PNG ou WebP · até {(MAX_FILE_SIZE_BYTES / 1048576).toFixed(0)} MB
        </p>
      </div>

      <ImagePreview src={previewUrl} alt={altText || description} />
      {dims && (
        <p className="text-xs text-slate-500">
          Dimensões originais: {dims.width} × {dims.height} px
        </p>
      )}

      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva a imagem"
        />
      </div>

      <div>
        <Label htmlFor="altText">Texto alternativo</Label>
        <Input
          id="altText"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Descrição para leitores de tela"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="width">Largura inicial (opcional)</Label>
          <Input
            id="width"
            type="number"
            min={1}
            value={customWidth}
            onChange={(e) => setCustomWidth(e.target.value)}
            placeholder={dims ? String(dims.width) : "auto"}
          />
        </div>
        <div>
          <Label htmlFor="height">Altura inicial (opcional)</Label>
          <Input
            id="height"
            type="number"
            min={1}
            value={customHeight}
            onChange={(e) => setCustomHeight(e.target.value)}
            placeholder={dims ? String(dims.height) : "auto"}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/images")}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Publicando…" : "Publicar no quadro"}
        </Button>
      </div>
    </form>
  );
}
