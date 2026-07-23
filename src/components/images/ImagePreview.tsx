"use client";

interface Props {
  src: string | null;
  alt?: string;
}

export function ImagePreview({ src, alt = "Pré-visualização" }: Props) {
  return (
    <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="text-sm text-slate-400">
          Selecione um arquivo para pré-visualizar
        </span>
      )}
    </div>
  );
}
