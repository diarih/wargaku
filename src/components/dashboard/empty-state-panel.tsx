import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

type EmptyStatePanelProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  variant?: "dashed" | "simple";
  headingLevel?: "h2" | "h3";
  semanticHeading?: boolean;
};

export function EmptyStatePanel({
  title,
  description,
  children,
  className,
  variant = "dashed",
  headingLevel = "h3",
  semanticHeading = false,
}: EmptyStatePanelProps) {
  const Heading = headingLevel;

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        variant === "dashed"
          ? "text-muted-foreground border-dashed"
          : "bg-muted/30",
        className,
      )}
    >
      {semanticHeading ? (
        <Heading className="text-sm font-medium text-foreground">
          {title}
        </Heading>
      ) : (
        <p className="text-sm font-medium text-foreground">{title}</p>
      )}
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
