import { Skeleton } from "~/components/ui/skeleton";

export default function EditResidentLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-[720px] w-full rounded-2xl" />
    </div>
  );
}
