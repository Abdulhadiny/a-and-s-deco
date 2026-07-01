"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  /** Tailwind class(es) applied to the image preview box. Defaults to max-w-[11rem]. */
  previewClassName?: string;
}

export function ImageUpload({ value, onChange, disabled, previewClassName }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }

      const { url } = await res.json();
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/50",
          previewClassName ?? "max-w-[11rem]",
          disabled && "opacity-50",
        )}
      >
        {value ? (
          <>
            <img src={value} alt="Item image" className="size-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 hover:bg-background"
                aria-label="Remove image"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </>
        ) : (
          <ImageIcon className="size-10 text-muted-foreground/30" />
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon className="size-3.5" />
        {uploading ? "Uploading..." : value ? "Change Image" : "Upload Image"}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
