import { SkeletonBox, SkeletonText, ProductCardSkeleton } from './Skeleton';

const ProductDetailSkeleton = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="pt-6 pb-4">
            <SkeletonBox className="h-3 w-48" />
        </div>

        {/* Main layout: image gallery + product info */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 lg:gap-12">
            {/* Image gallery */}
            <div className="space-y-4">
                <SkeletonBox className="w-full h-[500px] sm:h-[600px] lg:h-[700px] rounded-none" />
                <div className="flex gap-3 overflow-hidden">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonBox key={i} className="flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24" />
                    ))}
                </div>
            </div>

            {/* Product info */}
            <div className="space-y-6">
                <SkeletonBox className="h-3 w-20" />
                <SkeletonBox className="h-7 w-3/4" />
                <SkeletonBox className="h-6 w-28" />

                {/* Color swatches */}
                <div>
                    <SkeletonBox className="h-3 w-16 mb-3" />
                    <div className="flex gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <SkeletonBox key={i} className="w-8 h-8 rounded-full" />
                        ))}
                    </div>
                </div>

                {/* Size grid */}
                <div>
                    <SkeletonBox className="h-3 w-12 mb-3" />
                    <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonBox key={i} className="w-12 h-10 rounded-md" />
                        ))}
                    </div>
                </div>

                {/* Add to cart button */}
                <SkeletonBox className="h-12 w-full rounded-lg" />

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonBox key={i} className="h-16 rounded-lg" />
                    ))}
                </div>

                {/* Description / tabs */}
                <div className="pt-4 space-y-4">
                    <div className="flex gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonBox key={i} className="h-8 w-20 rounded-lg" />
                        ))}
                    </div>
                    <SkeletonText lines={4} />
                </div>
            </div>
        </div>

        {/* Related products */}
        <div className="py-12">
            <SkeletonBox className="h-6 w-48 mb-6" />
            <div className="flex gap-4 overflow-hidden lg:grid lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-[260px] sm:w-[280px] lg:w-auto">
                        <ProductCardSkeleton />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default ProductDetailSkeleton;
