import type { ReactNode } from "react";

import { format } from "date-fns";
import { FileText } from "lucide-react";

import { buttonVariants } from "~/components/ui/button.styles";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type FileAssetRowProps = {
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  openHref?: string | null;
  actions?: ReactNode;
  className?: string;
};

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export function FileAssetRow({
  fileName,
  mimeType,
  size,
  createdAt,
  openHref,
  actions,
  className,
}: FileAssetRowProps) {
  return (
    <div className={cn("rounded-2xl border bg-muted/30 px-4 py-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="bg-background inline-flex size-10 items-center justify-center rounded-xl border">
            <FileText className="text-primary size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">{fileName}</p>
            <p className="text-muted-foreground text-xs">
              {formatFileSize(size)} - {mimeType}
            </p>
          </div>
        </div>
        <Badge variant="outline">{format(createdAt, "dd MMM yyyy")}</Badge>
      </div>

      {(openHref || actions) ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {openHref ? (
            <a
              href={openHref}
              aria-label={`Buka dokumen ${fileName}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Buka dokumen
            </a>
          ) : null}
          {actions}
        </div>
      ) : null}
    </div>
  );
}
