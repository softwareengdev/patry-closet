import { SkeletonBox, ProductCardSkeleton } from './Skeleton';

const ProductsPageSkeleton = () => (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header bar */}
        <div className="flex items-center justify-between py-5 border-b border-warm-200 dark:border-gray-800">
            <SkeletonBox className="h-8 w-24" />
            <div className="flex items-center gap-3">
                <SkeletonBox className="h-8 w-32" />
                <SkeletonBox className="h-8 w-8 hidden lg:block" />
            </div>
        </div>

        <div className="flex gap-10 pt-6 pb-20">
            {/* Sidebar skeleton — matches w-72 sticky sidebar */}
            <div className="hidden lg:block w-72 flex-shrink-0 space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        <SkeletonBox className="h-4 w-28" />
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, j) => (
                                <SkeletonBox key={j} className="h-3 w-full" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Product grid skeleton */}
            <div className="flex-1 min-w-0">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default ProductsPageSkeleton;
