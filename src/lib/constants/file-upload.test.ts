import { describe, expect, it } from "vitest";
import {
  getUploadConstraints,
  formatFileSize,
  getFileIconName,
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

describe("getFileIconName", () => {
  it("maps text-like extensions to FileText", () => {
    expect(getFileIconName("notes.txt")).toBe("FileText");
    expect(getFileIconName("README.md")).toBe("FileText");
  });

  it("maps .json to FileJson", () => {
    expect(getFileIconName("config.json")).toBe("FileJson");
  });

  it("maps code-like extensions to FileCode", () => {
    expect(getFileIconName("data.yaml")).toBe("FileCode");
    expect(getFileIconName("data.yml")).toBe("FileCode");
    expect(getFileIconName("doc.xml")).toBe("FileCode");
    expect(getFileIconName("config.toml")).toBe("FileCode");
    expect(getFileIconName("settings.ini")).toBe("FileCode");
  });

  it("maps .csv to FileSpreadsheet", () => {
    expect(getFileIconName("export.csv")).toBe("FileSpreadsheet");
  });

  it("falls back to File for unmapped extensions", () => {
    expect(getFileIconName("document.pdf")).toBe("File");
  });

  it("is case-insensitive", () => {
    expect(getFileIconName("NOTES.TXT")).toBe("FileText");
  });
});
