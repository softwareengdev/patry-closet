/**
 * Reviews API Service
 * Handles product review CRUD operations with mock fallback.
 */
import api from './api';

/**
 * Fetch paginated reviews for a product.
 */
export async function getProductReviews(productId, { page = 1, pageSize = 10 } = {}) {
    try {
        const { data } = await api.get(`/v1/reviews/product/${productId}`, {
            params: { page, pageSize },
        });
        return {
            data: data.data ?? [],
            pagination: data.pagination ?? null,
        };
    } catch {
        console.warn('[reviewsApi] Backend unavailable — returning empty reviews');
        return { data: [], pagination: null };
    }
}

/**
 * Fetch review summary (average rating + distribution) for a product.
 */
export async function getReviewSummary(productId) {
    try {
        const { data } = await api.get(`/v1/reviews/product/${productId}/summary`);
        return data.data ?? null;
    } catch {
        console.warn('[reviewsApi] Backend unavailable — returning null summary');
        return null;
    }
}

/**
 * Fetch current user's reviews.
 */
export async function getMyReviews({ page = 1, pageSize = 10 } = {}) {
    try {
        const { data } = await api.get('/v1/reviews/me', {
            params: { page, pageSize },
        });
        return {
            data: data.data ?? [],
            pagination: data.pagination ?? null,
        };
    } catch {
        console.warn('[reviewsApi] Backend unavailable — returning empty user reviews');
        return { data: [], pagination: null };
    }
}

/**
 * Create a new review for a product.
 */
export async function createReview({ productId, rating, title, comment }) {
    const { data } = await api.post('/v1/reviews', {
        productId,
        rating,
        title: title || null,
        comment: comment || null,
    });
    return data.data;
}

/**
 * Update an existing review.
 */
export async function updateReview(reviewId, { rating, title, comment }) {
    const { data } = await api.put(`/v1/reviews/${reviewId}`, {
        rating,
        title: title || null,
        comment: comment || null,
    });
    return data.data;
}

/**
 * Delete a review.
 */
export async function deleteReview(reviewId) {
    await api.delete(`/v1/reviews/${reviewId}`);
}

const reviewsApi = {
    getProductReviews,
    getReviewSummary,
    getMyReviews,
    createReview,
    updateReview,
    deleteReview,
};

export default reviewsApi;
