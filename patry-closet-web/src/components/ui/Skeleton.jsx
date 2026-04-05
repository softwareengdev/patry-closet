/**
 * Base skeleton building blocks for shimmer loading states.
 */

// Base shimmer box
export const SkeletonBox = ({ className = '' }) => (
    <div className={`animate-pulse bg-warm-300/60 dark:bg-gray-800 rounded ${className}`} />
);

// Text line skeleton — last line renders at 2/3 width for realism
export const SkeletonText = ({ lines = 1, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div
                key={i}
                className={`animate-pulse bg-warm-300/60 dark:bg-gray-800 rounded h-3 ${i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'}`}
            />
        ))}
    </div>
);

// Circular skeleton (avatars, icons)
export const SkeletonCircle = ({ className = '' }) => (
    <div className={`animate-pulse bg-warm-300/60 dark:bg-gray-800 rounded-full ${className}`} />
);

// Product card skeleton — reusable across pages
export const ProductCardSkeleton = () => (
    <div className="bg-warm-50 dark:bg-gray-900 rounded overflow-hidden">
        <SkeletonBox className="aspect-[3/4] w-full rounded-none" />
        <div className="px-1 pt-3 pb-4 space-y-2">
            <SkeletonBox className="h-3 w-1/3" />
            <SkeletonBox className="h-3 w-full" />
            <SkeletonBox className="h-4 w-1/4" />
        </div>
    </div>
);
