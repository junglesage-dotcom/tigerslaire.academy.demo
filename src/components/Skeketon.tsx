export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-bone/10 ${className}`} />
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border border-bone/10 bg-coal p-5 space-y-3">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full mt-4" />
    </div>
  );
}