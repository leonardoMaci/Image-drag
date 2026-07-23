import { describe, it, expect } from "vitest";
import {
  validateExtension,
  validateMimeType,
  validateSize,
  validateDescription,
  sanitizeText,
  sniffImageType,
  MAX_FILE_SIZE_BYTES,
} from "./validation";

describe("validateExtension", () => {
  it("accepts supported extensions", () => {
    for (const name of ["a.jpg", "b.jpeg", "c.PNG", "d.webp"]) {
      expect(validateExtension(name).ok).toBe(true);
    }
  });
  it("rejects unsupported extensions", () => {
    expect(validateExtension("evil.exe").ok).toBe(false);
    expect(validateExtension("noext").ok).toBe(false);
  });
});

describe("validateMimeType", () => {
  it("accepts image mime types", () => {
    expect(validateMimeType("image/png").ok).toBe(true);
    expect(validateMimeType("image/webp").ok).toBe(true);
  });
  it("rejects non-image mime types", () => {
    expect(validateMimeType("application/x-msdownload").ok).toBe(false);
  });
});

describe("validateSize", () => {
  it("rejects empty and oversized files", () => {
    expect(validateSize(0).ok).toBe(false);
    expect(validateSize(MAX_FILE_SIZE_BYTES + 1).ok).toBe(false);
  });
  it("accepts files within the limit", () => {
    expect(validateSize(1024).ok).toBe(true);
  });
});

describe("validateDescription", () => {
  it("requires a non-empty description", () => {
    expect(validateDescription("").ok).toBe(false);
    expect(validateDescription("   ").ok).toBe(false);
    expect(validateDescription(undefined).ok).toBe(false);
    expect(validateDescription("Uma imagem").ok).toBe(true);
  });
});

describe("sanitizeText", () => {
  it("strips control characters and trims, keeping normal spaces", () => {
    expect(sanitizeText("  hi there  ")).toBe("hi there");
    // Embedded control chars (NUL, vertical tab) are removed.
    expect(sanitizeText("a\u0000b\u000Bc")).toBe("abc");
  });
});

describe("sniffImageType", () => {
  it("detects PNG magic bytes", () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    expect(sniffImageType(png)).toBe("image/png");
  });
  it("detects JPEG magic bytes", () => {
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(sniffImageType(jpg)).toBe("image/jpeg");
  });
  it("detects WebP magic bytes", () => {
    const webp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(sniffImageType(webp)).toBe("image/webp");
  });
  it("rejects a disguised executable", () => {
    const exe = Buffer.from([0x4d, 0x5a, 0x90, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(sniffImageType(exe)).toBeNull();
  });
});
