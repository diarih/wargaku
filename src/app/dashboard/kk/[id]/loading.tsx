import { Skeleton } from "~/components/ui/skeleton";

export default function HouseholdDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-96 rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
