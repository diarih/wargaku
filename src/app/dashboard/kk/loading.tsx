import { Skeleton } from "~/components/ui/skeleton";

export default function HouseholdLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-80 rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    </div>
  );
}
