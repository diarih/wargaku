"use client";

import { useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";

type FileDeleteButtonProps = {
  fileId: string;
  fileName: string;
};

export function FileDeleteButton({ fileId, fileName }: FileDeleteButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/storage/${fileId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        toast.error(payload?.message ?? "Berkas gagal dihapus.");
        return;
      }

      toast.success(`Berkas ${fileName} berhasil dihapus.`);
      setIsConfirming(false);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  if (isConfirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs">
          Hapus permanen dari penyimpanan?
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDeleting}
          onClick={() => setIsConfirming(false)}
        >
          Batal
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isDeleting}
          onClick={handleDelete}
        >
          {isDeleting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          {isDeleting ? "Menghapus..." : "Ya, hapus"}
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={() => setIsConfirming(true)}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
      {isDeleting ? "Menghapus..." : "Hapus"}
    </Button>
  );
}
