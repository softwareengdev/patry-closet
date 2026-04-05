/**
 * Orders API Service
 * Handles order-related API calls to the backend.
 */
import api from './api';

const ordersApi = {
    /**
     * Get current user's orders (paginated).
     */
    async getOrders({ status, fromDate, toDate, sortBy = 'newest', page = 1, pageSize = 20 } = {}) {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (fromDate) params.set('fromDate', fromDate);
        if (toDate) params.set('toDate', toDate);
        params.set('sortBy', sortBy);
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));

        const { data } = await api.get(`/v1/orders?${params.toString()}`);
        return { orders: data.data, pagination: data.pagination };
    },

    /**
     * Get single order detail.
     */
    async getOrder(orderId) {
        const { data } = await api.get(`/v1/orders/${orderId}`);
        return data.data;
    },

    /**
     * Create order from cart (legacy — prefer payments/checkout for Stripe flow).
     */
    async createOrder({ shippingAddressId, shippingMethod = 'Standard', couponCode, notes }) {
        const { data } = await api.post('/v1/orders', {
            shippingAddressId,
            shippingMethod,
            couponCode: couponCode || undefined,
            notes: notes || undefined,
        });
        return data.data;
    },

    /**
     * Cancel an order.
     */
    async cancelOrder(orderId, reason) {
        const { data } = await api.post(`/v1/orders/${orderId}/cancel`, {
            reason: reason || undefined,
        });
        return data;
    },
};

export default ordersApi;
