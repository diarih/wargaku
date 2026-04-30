import { format } from "date-fns";

import type { AuditTimelineItem } from "~/server/audit";
import { EmptyStatePanel } from "~/components/dashboard/empty-state-panel";
import { SectionHeading } from "~/components/dashboard/section-heading";
import { Card, CardContent, CardHeader } from "~/components/ui/card";

type AuditTimelineProps = {
  items: AuditTimelineItem[];
};

export function AuditTimeline({ items }: AuditTimelineProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <SectionHeading
          title="Riwayat Aktivitas"
          description="Catatan perubahan penting pada data ini."
        />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyStatePanel title="Belum ada aktivitas tercatat." />
        ) : (
          <ol className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border px-4 py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {item.summary}
                    </p>
                  </div>
                  <p className="text-muted-foreground text-xs whitespace-nowrap">
                    {format(item.createdAt, "dd MMM yyyy HH:mm")}
                  </p>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  {item.actorName}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
