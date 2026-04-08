import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProductReviews,
    getReviewSummary,
    getMyReviews,
    createReview,
    updateReview,
    deleteReview,
} from '../lib/reviewsApi';

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Paginated product reviews.
 */
export function useProductReviews(productId, { page = 1, pageSize = 10 } = {}) {
    return useQuery({
        queryKey: ['reviews', productId, page, pageSize],
        queryFn: () => getProductReviews(productId, { page, pageSize }),
        enabled: !!productId,
        staleTime: FIVE_MINUTES,
        retry: 1,
    });
}

/**
 * Review summary (average + distribution).
 */
export function useReviewSummary(productId) {
    return useQuery({
        queryKey: ['reviewSummary', productId],
        queryFn: () => getReviewSummary(productId),
        enabled: !!productId,
        staleTime: FIVE_MINUTES,
        retry: 1,
    });
}

/**
 * Current user's reviews.
 */
export function useMyReviews({ page = 1, pageSize = 10 } = {}) {
    return useQuery({
        queryKey: ['myReviews', page, pageSize],
        queryFn: () => getMyReviews({ page, pageSize }),
        staleTime: FIVE_MINUTES,
        retry: 1,
    });
}

/**
 * Create review mutation.
 */
export function useCreateReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createReview,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['reviewSummary', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product'] });
            queryClient.invalidateQueries({ queryKey: ['myReviews'] });
        },
    });
}

/**
 * Update review mutation.
 */
export function useUpdateReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reviewId, ...data }) => updateReview(reviewId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            queryClient.invalidateQueries({ queryKey: ['reviewSummary'] });
            queryClient.invalidateQueries({ queryKey: ['product'] });
            queryClient.invalidateQueries({ queryKey: ['myReviews'] });
        },
    });
}

/**
 * Delete review mutation.
 */
export function useDeleteReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteReview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            queryClient.invalidateQueries({ queryKey: ['reviewSummary'] });
            queryClient.invalidateQueries({ queryKey: ['product'] });
            queryClient.invalidateQueries({ queryKey: ['myReviews'] });
        },
    });
}
