import { Skeleton } from "~/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
