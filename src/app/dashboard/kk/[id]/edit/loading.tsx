import { Skeleton } from "~/components/ui/skeleton";

export default function EditHouseholdLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-72 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
