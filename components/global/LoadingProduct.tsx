import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingProduct() {
  return (
    <section>
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="mt-6 grid gap-y-8 lg:grid-cols-2 lg:gap-x-16">
        {/* Left: image + description */}
        <div>
          <div className="relative w-full aspect-[4/3]">
            <Skeleton className="h-full w-full rounded object-cover" />
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>

        {/* Right: title, favorite, rating, price, info list, add to cart */}
        <div>
          <div className="flex items-center gap-x-4">
            <Skeleton className="h-8 w-2/3" /> {/* name */}
            <Skeleton className="h-8 w-8 rounded-full" /> {/* favorite btn */}
          </div>
          <Skeleton className="mt-3 h-4 w-32" /> {/* rating */}
          <Skeleton className="mt-2 h-4 w-40" /> {/* ref_gebauede_geschoss */}
          <Skeleton className="mt-3 h-8 w-28 rounded-md" /> {/* price */}
          <div className="mt-4 space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex gap-4 items-center">
                <Skeleton className="h-4 w-40" /> {/* label */}
                <Skeleton className="h-4 w-32" /> {/* value */}
              </div>
            ))}
          </div>
          <Skeleton className="mt-6 h-11 w-40 rounded-md" /> {/* AddToCart */}
        </div>
      </div>
    </section>
  );
}
