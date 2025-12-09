import { Skeleton } from '../ui/skeleton';

/**
 * Skeleton loader cho ReviewCard component
 */
export function ReviewCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 border border-neutral-200">
      <div className="flex items-start gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mb-4">
        <Skeleton className="h-5 w-20 mb-2" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex items-center gap-4 pt-4 border-t border-neutral-100">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

/**
 * Grid of ReviewCard skeletons
 */
export function ReviewCardSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <ReviewCardSkeleton key={index} />
      ))}
    </div>
  );
}

