import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

/**
 * GET /uploads/:name — serve an uploaded image from UPLOAD_DIR.
 *
 * Next only serves static files that live under `public/`. When UPLOAD_DIR
 * points elsewhere (e.g. a mounted volume at /data/uploads in production),
 * the stored files are outside `public/`, so we stream them from disk here.
 * The stored URL (`/uploads/<file>`, from src/lib/storage.ts) maps to this
 * route.
 */

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "public/uploads";

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

type Params = { params: { name: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  // Only ever serve a bare filename — reject anything that could escape the
  // upload directory (path traversal, nested paths).
  const name = params.name;
  if (!name || name !== path.basename(name)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const contentType = CONTENT_TYPE_BY_EXT[path.extname(name).toLowerCase()];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  const absDir = path.isAbsolute(UPLOAD_DIR)
    ? UPLOAD_DIR
    : path.join(process.cwd(), UPLOAD_DIR);

  try {
    const file = await readFile(path.join(absDir, name));
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        // Filenames are random UUIDs, so the content never changes.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
