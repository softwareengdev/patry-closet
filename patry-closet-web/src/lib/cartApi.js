/**
 * Cart API Service
 * Handles cart synchronization with the backend.
 */
import api from './api';

const cartApi = {
    /**
     * Get the server-side cart.
     */
    async getCart() {
        const { data } = await api.get('/v1/cart');
        return data.data;
    },

    /**
     * Add item to server cart.
     */
    async addItem({ productId, productVariantId, quantity = 1 }) {
        const { data } = await api.post('/v1/cart/items', {
            productId,
            productVariantId: productVariantId || undefined,
            quantity,
        });
        return data.data;
    },

    /**
     * Update item quantity.
     */
    async updateItem(itemId, quantity) {
        const { data } = await api.put(`/v1/cart/items/${itemId}`, { quantity });
        return data.data;
    },

    /**
     * Remove item from cart.
     */
    async removeItem(itemId) {
        await api.delete(`/v1/cart/items/${itemId}`);
    },

    /**
     * Clear entire cart.
     */
    async clearCart() {
        await api.delete('/v1/cart');
    },

    /**
     * Merge local cart items into server cart.
     * Accepts array of { productId, productVariantId, quantity }.
     */
    async mergeCart(items) {
        const { data } = await api.post('/v1/cart/merge', { items });
        return data.data;
    },

    /**
     * Sync local cart items to server in batch.
     * Clears server cart and adds all local items.
     */
    async syncLocalCartToServer(localCartItems) {
        // Map local cart items to server format
        const items = localCartItems.map(item => ({
            productId: item.id,
            productVariantId: item.variantId || undefined,
            quantity: item.quantity,
        }));

        if (items.length > 0) {
            return await cartApi.mergeCart(items);
        }
        return null;
    },
};

export default cartApi;
