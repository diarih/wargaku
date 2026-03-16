import { Skeleton } from "~/components/ui/skeleton";

export default function NewResidentLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Skeleton className="h-[720px] rounded-2xl" />
        <Skeleton className="h-[720px] rounded-2xl" />
      </div>
    </div>
  );
}
