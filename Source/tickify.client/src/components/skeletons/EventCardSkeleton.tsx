import { Skeleton } from '../ui/skeleton';

/**
 * Skeleton loader cho EventCard component
 * Hiển thị khi đang load event data
 */
export function EventCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
      <div className="aspect-[4/3] overflow-hidden bg-muted relative">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-6 w-full mb-1" />
        <Skeleton className="h-6 w-3/4 mb-3" />
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of EventCard skeletons
 */
export function EventCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </div>
  );
}

