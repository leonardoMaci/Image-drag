import { create } from "zustand";
import type { BoardImage, SlotAssignment } from "@/types/board-image";

export interface BoardState {
  /** Sorted by slot. Slots are sparse — gaps are real empty cells. */
  images: BoardImage[];
  selectedImageId: string | null;

  // --- selection ---
  selectImage: (id: string | null) => void;

  // --- data ---
  setImages: (images: BoardImage[]) => void;
  /** Apply slot assignments (a move, or the two halves of a swap). */
  applyPositions: (items: SlotAssignment[]) => void;
  updateImage: (id: string, changes: Partial<BoardImage>) => void;
  removeImage: (id: string) => void;

  // helpers
  getImage: (id: string) => BoardImage | undefined;
  getImageAt: (position: number) => BoardImage | undefined;
  /** Every image's current slot, to roll back a failed drag. */
  getPositions: () => SlotAssignment[];
}

function sortByPosition(images: BoardImage[]): BoardImage[] {
  return [...images].sort((a, b) => a.position - b.position);
}

export const useBoardStore = create<BoardState>((set, get) => ({
  images: [],
  selectedImageId: null,

  selectImage: (id) => set({ selectedImageId: id }),

  setImages: (images) => set({ images: sortByPosition(images) }),

  applyPositions: (items) =>
    set((state) => {
      const byId = new Map(items.map((i) => [i.id, i.position]));
      return {
        images: sortByPosition(
          state.images.map((img) =>
            byId.has(img.id)
              ? { ...img, position: byId.get(img.id) as number }
              : img
          )
        ),
      };
    }),

  updateImage: (id, changes) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, ...changes } : img
      ),
    })),

  // Deleting leaves the slot empty instead of pulling the rest forward.
  removeImage: (id) =>
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
      selectedImageId:
        state.selectedImageId === id ? null : state.selectedImageId,
    })),

  getImage: (id) => get().images.find((img) => img.id === id),

  getImageAt: (position) =>
    get().images.find((img) => img.position === position),

  getPositions: () =>
    get().images.map((img) => ({ id: img.id, position: img.position })),
}));
