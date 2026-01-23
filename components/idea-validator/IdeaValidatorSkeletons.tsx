import { Skeleton } from "../ui/skeleton";

export const IdeaValidatorSkeleton = () => (
  <div className="space-y-12">
    {/* Uniqueness Score Skeleton */}
    <div className="bg-white border rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-[150px]" />
          <Skeleton className="h-4 w-[120px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-8" />
        </div>
      </div>
      <div className="mt-4">
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>

    {/* Similar Companies Skeleton */}
    <div className="space-y-6">
      <Skeleton className="h-7 w-[250px]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 border rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-3 w-1/3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Analysis Skeleton */}
    <div className="bg-white border rounded-lg p-6 space-y-6 animate-pulse">
      <Skeleton className="h-7 w-[280px]" />

      {/* Overview */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-[150px]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Key Players */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-[120px]" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>

      {/* Gaps */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-[180px]" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="border-t pt-6 space-y-2">
        <Skeleton className="h-5 w-[150px]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  </div>
);
