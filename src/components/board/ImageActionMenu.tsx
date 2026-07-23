"use client";

interface Props {
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Contextual action menu for the selected card. Anchored to the card itself —
 * the grid has no free coordinates to position it against.
 *
 * "Trazer para frente" is gone with the free canvas: cards in the grid never
 * overlap, so there is no layer to raise. Order is changed by dragging.
 */
export function ImageActionMenu({ onEdit, onDelete }: Props) {
  return (
    <div
      role="menu"
      aria-label="Ações da imagem"
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute right-2 top-2 z-40 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
    >
      <button
        role="menuitem"
        onClick={onEdit}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
      >
        ✏️ Editar descrição
      </button>
      <button
        role="menuitem"
        onClick={onDelete}
        className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
      >
        🗑️ Excluir imagem
      </button>
    </div>
  );
}
