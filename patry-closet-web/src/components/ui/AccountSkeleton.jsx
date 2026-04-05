import { SkeletonBox, SkeletonCircle } from './Skeleton';

const AccountSkeleton = () => (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-6">
            <SkeletonCircle className="w-12 h-12" />
            <div className="space-y-2">
                <SkeletonBox className="h-4 w-36" />
                <SkeletonBox className="h-3 w-24" />
            </div>
        </div>

        <div className="flex gap-6 sm:gap-8">
            {/* Sidebar nav */}
            <div className="hidden sm:block w-56 shrink-0 space-y-1">
                {Array.from({ length: 7 }).map((_, i) => (
                    <SkeletonBox key={i} className="h-10 w-full rounded-md" />
                ))}
            </div>

            {/* Main content — form fields */}
            <div className="flex-1 min-w-0 space-y-6">
                <SkeletonBox className="h-6 w-40 mb-4" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <SkeletonBox className="h-3 w-24" />
                        <SkeletonBox className="h-10 w-full rounded-md" />
                    </div>
                ))}
                <SkeletonBox className="h-10 w-32 rounded-lg" />
            </div>
        </div>
    </div>
);

export default AccountSkeleton;
