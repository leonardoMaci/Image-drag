import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

/**
 * Local filesystem storage adapter.
 *
 * The app stores only the public URL + metadata in the database; the binary
 * lives on disk under `public/uploads`. Swap this module for an S3/R2 client
 * (same `saveFile`/`deleteFile` signatures) to move to cloud storage without
 * touching the API routes.
 */

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "public/uploads";
const PUBLIC_PATH = process.env.UPLOAD_PUBLIC_PATH ?? "/uploads";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type SavedFile = {
  url: string;
  fileName: string;
};

export async function saveFile(
  buffer: Buffer,
  mimeType: string
): Promise<SavedFile> {
  const ext = EXT_BY_MIME[mimeType] ?? "bin";
  const fileName = `${randomUUID()}.${ext}`;
  const absDir = path.join(process.cwd(), UPLOAD_DIR);
  await mkdir(absDir, { recursive: true });
  await writeFile(path.join(absDir, fileName), buffer);
  return {
    url: `${PUBLIC_PATH}/${fileName}`,
    fileName,
  };
}

export async function deleteFile(fileUrl: string): Promise<void> {
  // Only handle files we manage (under the public path). Ignore anything else.
  if (!fileUrl.startsWith(`${PUBLIC_PATH}/`)) return;
  const fileName = path.basename(fileUrl);
  const absPath = path.join(process.cwd(), UPLOAD_DIR, fileName);
  try {
    await unlink(absPath);
  } catch (err: unknown) {
    // Missing file is fine (already gone). Re-throw anything else.
    if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") {
      throw err;
    }
  }
}
