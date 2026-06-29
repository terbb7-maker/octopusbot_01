import { Skeleton } from "@/components/ui/skeleton";

export default function BotsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <Skeleton className="h-32 w-full rounded-md bg-white/[0.06]" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 rounded-md bg-white/[0.06]" />
        <Skeleton className="h-32 rounded-md bg-white/[0.06]" />
        <Skeleton className="h-32 rounded-md bg-white/[0.06]" />
      </div>
      <Skeleton className="h-64 rounded-md bg-white/[0.06]" />
    </div>
  );
}
