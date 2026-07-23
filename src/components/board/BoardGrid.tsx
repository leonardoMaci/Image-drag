"use client";

import { useRef, useState, type ReactNode } from "react";
import type { BoardImage } from "@/types/board-image";
import { BoardImageCard } from "./BoardImageCard";
import { GRID_COLUMNS, GRID_GAP, CELL_ASPECT_RATIO } from "./board-constants";

interface Props {
  images: BoardImage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDeselect: () => void;
  /** Drop finished: put `id` in `position`, swapping if it's taken. */
  onDropInSlot: (id: string, position: number) => void;
  /** Action menu for the selected card. */
  renderActions: (image: BoardImage) => ReactNode;
}

/**
 * How many slots the board shows: every occupied row plus one spare row, so
 * there is always somewhere free to drag to.
 */
function slotCount(images: BoardImage[]): number {
  const highest = images.reduce((max, img) => Math.max(max, img.position), -1);
  const usedRows = Math.floor(highest / GRID_COLUMNS) + 1;
  return (usedRows + 1) * GRID_COLUMNS;
}

/**
 * The board: a fixed grid of GRID_COLUMNS images per row. Slots are sparse —
 * a card can be dragged into any empty cell, and dropping it onto an occupied
 * cell swaps the two. No free positioning, no panning, no zoom.
 */
export function BoardGrid({
  images,
  selectedId,
  onSelect,
  onDeselect,
  onDropInSlot,
  renderActions,
}: Props) {
  const draggingIdRef = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);

  const byPosition = new Map(images.map((img) => [img.position, img]));
  const slots = Array.from({ length: slotCount(images) }, (_, i) => i);

  const handleDragStart = (id: string) => {
    draggingIdRef.current = id;
    onSelect(id);
    // Deferred: re-rendering the source element inside `dragstart` aborts the
    // drag in Chrome/Safari.
    requestAnimationFrame(() => setDraggingId(id));
  };

  const handleDragEnd = () => {
    draggingIdRef.current = null;
    setDraggingId(null);
    setHoverSlot(null);
  };

  const handleDrop = (position: number) => {
    const id = draggingIdRef.current;
    handleDragEnd();
    if (!id) return;
    // Dropping a card back where it started is a no-op.
    if (byPosition.get(position)?.id === id) return;
    onDropInSlot(id, position);
  };

  return (
    <div
      className="h-full overflow-auto p-4"
      onMouseDown={(e) => {
        // Clicking the empty area around the grid clears the selection.
        if (e.target === e.currentTarget) onDeselect();
      }}
    >
      <div
        className="mx-auto grid w-full max-w-6xl"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
          gap: GRID_GAP,
        }}
      >
        {slots.map((position) => {
          const image = byPosition.get(position);
          const isTarget = hoverSlot === position && draggingId !== null;

          const dropHandlers = {
            onDragOver: (e: React.DragEvent) => {
              // Required for the cell to be a valid drop target.
              e.preventDefault();
              e.dataTransfer.dropEffect = "move" as const;
              setHoverSlot(position);
            },
            onDragLeave: () =>
              setHoverSlot((s) => (s === position ? null : s)),
            onDrop: (e: React.DragEvent) => {
              e.preventDefault();
              handleDrop(position);
            },
          };

          if (image) {
            return (
              <BoardImageCard
                key={image.id}
                image={image}
                slot={position + 1}
                selected={image.id === selectedId}
                dragging={draggingId === image.id}
                dropTarget={isTarget && draggingId !== image.id}
                onSelect={onSelect}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                dropHandlers={dropHandlers}
                actions={renderActions(image)}
              />
            );
          }

          return (
            <div
              key={`slot-${position}`}
              {...dropHandlers}
              aria-hidden
              className={[
                "rounded-lg border-2 border-dashed transition",
                isTarget
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-slate-50/60",
              ].join(" ")}
              style={{
                // Match a card: image cell + caption line + padding.
                aspectRatio: String(CELL_ASPECT_RATIO),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
