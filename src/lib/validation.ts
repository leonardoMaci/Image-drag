export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export const MAX_FILE_SIZE_BYTES = Number(
  process.env.MAX_FILE_SIZE_BYTES ?? 10 * 1024 * 1024
);

export const MAX_DIMENSION = 8000;

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateExtension(fileName: string): ValidationResult {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (
    !ACCEPTED_EXTENSIONS.includes(ext as (typeof ACCEPTED_EXTENSIONS)[number])
  ) {
    return {
      ok: false,
      error: `Extensão não suportada (.${ext}). Use JPG, PNG ou WebP.`,
    };
  }
  return { ok: true };
}

export function validateMimeType(mimeType: string): ValidationResult {
  if (
    !ACCEPTED_MIME_TYPES.includes(
      mimeType as (typeof ACCEPTED_MIME_TYPES)[number]
    )
  ) {
    return {
      ok: false,
      error: `Tipo de arquivo não suportado (${mimeType}). Use JPG, PNG ou WebP.`,
    };
  }
  return { ok: true };
}

export function validateSize(sizeBytes: number): ValidationResult {
  if (sizeBytes <= 0) {
    return { ok: false, error: "Arquivo vazio ou inválido." };
  }
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    const mb = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
    return { ok: false, error: `Arquivo acima do limite de ${mb} MB.` };
  }
  return { ok: true };
}

export function validateDescription(description: unknown): ValidationResult {
  if (typeof description !== "string" || description.trim().length === 0) {
    return { ok: false, error: "A descrição é obrigatória." };
  }
  if (description.length > 2000) {
    return { ok: false, error: "A descrição excede 2000 caracteres." };
  }
  return { ok: true };
}

/**
 * Basic sanitization of free-text fields: strip control chars and trim.
 * We store text and render it as text (never as HTML), so this is defense
 * in depth rather than the primary XSS guard.
 */
export function sanitizeText(input: string): string {
  // Strip ASCII control characters (0x00-0x1F and 0x7F).
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x1F\x7F]/g, "").trim();
}

/**
 * Verify the leading bytes (magic numbers) match a supported image type.
 * Guards against executables renamed with an image extension.
 */
export function sniffImageType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // WebP: "RIFF"...."WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}
