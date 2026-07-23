"use client";

import dynamic from "next/dynamic";

// The board is drag-driven and loads its images client-side, so skip SSR.
const ImageBoard = dynamic(
  () => import("@/components/board/ImageBoard").then((m) => m.ImageBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Carregando quadro…
      </div>
    ),
  }
);

export default function BoardPage() {
  return <ImageBoard />;
}
