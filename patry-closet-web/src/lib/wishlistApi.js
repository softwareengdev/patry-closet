/**
 * Wishlist API Service
 * Connects to the real backend wishlist API with localStorage fallback.
 */
import api from './api';

/**
 * Get the authenticated user's wishlist.
 */
export async function getWishlist() {
    try {
        const { data } = await api.get('/v1/wishlist');
        return (data.data ?? []).map(normalizeWishlistItem);
    } catch {
        return [];
    }
}

/**
 * Add a product to the wishlist.
 */
export async function addToWishlist(productId) {
    try {
        await api.post(`/v1/wishlist/${productId}`);
        return true;
    } catch {
        return false;
    }
}

/**
 * Remove a product from the wishlist.
 */
export async function removeFromWishlist(productId) {
    try {
        await api.delete(`/v1/wishlist/${productId}`);
        return true;
    } catch {
        return false;
    }
}

/**
 * Sync local wishlist to server (merge on login).
 */
export async function syncWishlist(localItems) {
    try {
        await api.post('/v1/wishlist/sync', {
            productIds: localItems.map(item => item.id),
        });
        return true;
    } catch {
        return false;
    }
}

function normalizeWishlistItem(item) {
    return {
        id: item.productId ?? item.id,
        name: item.productName ?? item.name,
        price: item.price,
        originalPrice: item.originalPrice ?? null,
        image: item.imageUrl ?? item.image,
        brand: item.brand ?? '',
        discount: item.discountPercent ?? item.discount ?? 0,
        inStock: item.inStock ?? true,
        slug: item.slug ?? '',
    };
}

const wishlistApi = { getWishlist, addToWishlist, removeFromWishlist, syncWishlist };
export default wishlistApi;
