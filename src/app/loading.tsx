import { Skeleton } from "~/components/ui/skeleton";

export default function RootLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-5xl space-y-4">
        <Skeleton className="h-12 w-56 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </main>
  );
}
