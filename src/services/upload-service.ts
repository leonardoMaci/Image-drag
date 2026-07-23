export type UploadResult = {
  imageUrl: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
};

/** Sends the binary to /api/upload and returns the stored URL + metadata. */
export async function uploadFile(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      (json && (json.error as string)) ?? "Falha no envio do arquivo."
    );
  }
  return json as UploadResult;
}

/** Reads the intrinsic pixel dimensions of an image file in the browser. */
export function readImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}
