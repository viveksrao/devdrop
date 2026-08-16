"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  getUploadConstraints,
  formatFileSize,
} from "@/lib/constants/file-upload";

export interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

interface FileUploadProps {
  itemTypeName: "file" | "image";
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
}

function uploadWithProgress(
  file: File,
  itemTypeName: string,
  onProgress: (percent: number) => void
): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("itemTypeName", itemTypeName);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error ?? "Upload failed"));
        }
      } catch {
        reject(new Error("Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));

    xhr.send(formData);
  });
}

export function FileUpload({ itemTypeName, value, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { maxSize, mimeTypes, extensions } = getUploadConstraints(itemTypeName);

  async function handleFile(file: File) {
    setError(null);

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!extensions.includes(extension)) {
      setError(`Unsupported file extension: ${extension}`);
      return;
    }

    if (!mimeTypes.has(file.type)) {
      setError(`Unsupported file type: ${file.type}`);
      return;
    }

    if (file.size > maxSize) {
      setError(`File exceeds the ${formatFileSize(maxSize)} limit`);
      return;
    }

    setProgress(0);

    try {
      const uploaded = await uploadWithProgress(file, itemTypeName, setProgress);
      onChange(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setProgress(null);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-border p-3">
        {itemTypeName === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.fileUrl}
            alt={value.fileName}
            className="size-12 rounded object-cover"
          />
        ) : (
          <FileIcon className="size-8 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.fileName}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(value.fileSize)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => onChange(null)}
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        )}
      >
        <UploadCloud className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag and drop, or <span className="text-primary">browse</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {extensions.join(", ")} — up to {formatFileSize(maxSize)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={extensions.join(",")}
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {progress !== null && <Progress value={progress} />}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
