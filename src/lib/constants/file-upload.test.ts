import { describe, expect, it } from "vitest";
import {
  getUploadConstraints,
  formatFileSize,
  MAX_IMAGE_SIZE,
  MAX_FILE_SIZE,
} from "./file-upload";

describe("getUploadConstraints", () => {
  it("returns image constraints for the image type", () => {
    const constraints = getUploadConstraints("image");

    expect(constraints.maxSize).toBe(MAX_IMAGE_SIZE);
    expect(constraints.mimeTypes.has("image/png")).toBe(true);
    expect(constraints.extensions).toContain(".png");
    expect(constraints.extensions).not.toContain(".pdf");
  });

  it("returns file constraints for the file type", () => {
    const constraints = getUploadConstraints("file");

    expect(constraints.maxSize).toBe(MAX_FILE_SIZE);
    expect(constraints.mimeTypes.has("application/pdf")).toBe(true);
    expect(constraints.extensions).toContain(".pdf");
    expect(constraints.extensions).not.toContain(".png");
  });
});

describe("formatFileSize", () => {
  it("formats bytes under 1KB", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats sizes under 1MB in KB", () => {
    expect(formatFileSize(2048)).toBe("2.0 KB");
  });

  it("formats sizes at or over 1MB in MB", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
