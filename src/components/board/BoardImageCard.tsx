"use client";

import { useState, type ReactNode } from "react";
import type { BoardImage } from "@/types/board-image";
import { CELL_ASPECT_RATIO, CAPTION_MAX_CHARS } from "./board-constants";

interface Props {
  image: BoardImage;
  /** 1-based slot number, shown as a drag affordance. */
  slot: number;
  selected: boolean;
  dragging: boolean;
  /** Another card is hovering this slot and would swap with it. */
  dropTarget: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  /** dragOver/dragLeave/drop wiring owned by the grid slot. */
  dropHandlers: {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
  };
  /** Action menu overlay, rendered only while this card is selected. */
  actions?: ReactNode;
}

export function BoardImageCard({
  image,
  slot,
  selected,
  dragging,
  dropTarget,
  onSelect,
  onDragStart,
  onDragEnd,
  dropHandlers,
  actions,
}: Props) {
  const [failed, setFailed] = useState(false);

  const truncated = image.description.length > CAPTION_MAX_CHARS;
  const caption = truncated
    ? image.description.slice(0, CAPTION_MAX_CHARS - 1) + "…"
    : image.description;

  return (
    <div
      draggable
      onDragStart={(e) => {
        // Firefox requires data on the transfer object for the drag to start.
        e.dataTransfer.setData("text/plain", image.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(image.id);
      }}
      onDragEnd={onDragEnd}
      {...dropHandlers}
      onMouseDown={() => onSelect(image.id)}
      className={[
        "group relative cursor-grab rounded-lg border bg-white p-2 shadow-sm transition",
        "active:cursor-grabbing",
        dropTarget
          ? "border-blue-500 ring-2 ring-blue-500/60"
          : selected
            ? "border-blue-500 ring-2 ring-blue-500/40"
            : "border-slate-200 hover:border-slate-300",
        dragging ? "opacity-40" : "",
      ].join(" ")}
    >
      <div
        className="relative w-full overflow-hidden rounded bg-slate-100"
        style={{ aspectRatio: String(CELL_ASPECT_RATIO) }}
      >
        {failed ? (
          <div className="flex h-full items-center justify-center bg-red-50 px-2 text-center text-xs text-red-700">
            Imagem indisponível
          </div>
        ) : (
          // Plain <img>: the files are user uploads served from /public and the
          // board never needs next/image's remote optimization pipeline.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.imageUrl}
            alt={image.altText ?? image.description}
            draggable={false}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
        <span className="pointer-events-none absolute left-1.5 top-1.5 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white opacity-0 transition group-hover:opacity-100">
          {slot}
        </span>
      </div>

      <p
        className="mt-1.5 truncate text-xs text-slate-700"
        title={truncated ? image.description : undefined}
      >
        {caption}
      </p>

      {selected && actions}
    </div>
  );
}
