export interface BoardImage {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  originalFileName: string;
  description: string;
  altText?: string | null;

  width: number;
  height: number;

  /** Absolute slot index in the board grid (0-based, row-major, sparse). */
  position: number;

  mimeType: string;
  fileSize: number;

  createdAt: string;
  updatedAt: string;
}

export type CreateBoardImageInput = {
  imageUrl: string;
  thumbnailUrl?: string | null;
  originalFileName: string;
  description: string;
  altText?: string | null;
  width: number;
  height: number;
  mimeType: string;
  fileSize: number;
};

export type UpdateBoardImageInput = Partial<
  Pick<BoardImage, "description" | "altText">
>;

/** One image assigned to an absolute board slot. */
export type SlotAssignment = {
  id: string;
  position: number;
};
