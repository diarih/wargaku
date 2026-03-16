import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type CompletenessBadgeProps = {
  status: "complete" | "warning" | "critical";
  score: number;
  className?: string;
};

const statusConfig = {
  complete: {
    label: "Lengkap",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-700",
  },
  warning: {
    label: "Perlu dilengkapi",
    icon: AlertTriangle,
    className: "bg-amber-500/10 text-amber-700",
  },
  critical: {
    label: "Kritis",
    icon: ShieldAlert,
    className: "bg-rose-500/10 text-rose-700",
  },
} as const;

export function CompletenessBadge({
  status,
  score,
  className,
}: CompletenessBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={cn("gap-1.5", config.className, className)}
    >
      <Icon className="size-3.5" />
      {config.label} {score}%
    </Badge>
  );
}
