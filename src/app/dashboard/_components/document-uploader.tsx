"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";

type DocumentUploaderProps = {
  householdId?: string;
  residentId?: string;
};

export function DocumentUploader({
  householdId,
  residentId,
}: DocumentUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string>("");

  const fileSize = inputRef.current?.files?.[0]?.size;

  const handleUpload = () => {
    const file = inputRef.current?.files?.[0];

    if (!file) {
      toast.error("Pilih file terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);

      if (householdId) {
        formData.set("householdId", householdId);
      }

      if (residentId) {
        formData.set("residentId", residentId);
      }

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        toast.error(payload?.message ?? "Upload berkas gagal.");
        return;
      }

      toast.success(`Berkas ${file.name} berhasil diunggah.`);
      setFileName("");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label
          className={`bg-background flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            isPending
              ? "cursor-not-allowed opacity-70"
              : "hover:bg-muted cursor-pointer"
          }`}
        >
          <Upload className="text-primary size-4" />
          <span className="truncate">
            {fileName || "Pilih dokumen (maks. 5MB)"}
            {fileName && fileSize
              ? ` - ${(fileSize / 1024 / 1024).toFixed(2)} MB`
              : ""}
          </span>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            disabled={isPending}
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name ?? "")
            }
          />
        </label>

        <Button type="button" onClick={handleUpload} disabled={isPending}>
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {isPending ? "Mengunggah..." : "Upload berkas"}
        </Button>
      </div>

      <p aria-live="polite" className="text-muted-foreground text-xs">
        {isPending
          ? "Sedang mengunggah berkas ke penyimpanan..."
          : "Format umum seperti JPG, PNG, dan PDF didukung."}
      </p>
    </div>
  );
}
