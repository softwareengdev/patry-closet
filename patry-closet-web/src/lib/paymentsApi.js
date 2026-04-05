/**
 * Payments API Service
 * Handles all payment-related API calls to the backend.
 * Uses the authenticated api instance from api.js.
 */
import api from './api';

const paymentsApi = {
    /**
     * Create a checkout session (order + Stripe PaymentIntent).
     * Returns { clientSecret, paymentIntentId, orderId, orderNumber, amount, currency, publishableKey }
     */
    async createCheckout({ shippingAddressId, shippingMethod = 'Standard', couponCode, notes }) {
        const { data } = await api.post('/v1/payments/checkout', {
            shippingAddressId,
            shippingMethod,
            couponCode: couponCode || undefined,
            notes: notes || undefined,
        });
        return data.data;
    },

    /**
     * Confirm payment after Stripe.js confirmCardPayment.
     * Returns payment status details.
     */
    async confirmPayment(orderId, paymentIntentId) {
        const { data } = await api.post(`/v1/payments/${orderId}/confirm`, {
            paymentIntentId,
        });
        return data.data;
    },

    /**
     * Get payment status for an order.
     */
    async getPaymentStatus(orderId) {
        const { data } = await api.get(`/v1/payments/${orderId}/status`);
        return data.data;
    },

    /**
     * Cancel a pending payment and order.
     */
    async cancelPayment(orderId) {
        const { data } = await api.post(`/v1/payments/${orderId}/cancel`);
        return data;
    },

    /**
     * Process refund (admin only).
     */
    async processRefund(orderId, { amount, reason } = {}) {
        const { data } = await api.post(`/v1/payments/${orderId}/refund`, {
            amount: amount || undefined,
            reason: reason || undefined,
        });
        return data.data;
    },
};

export default paymentsApi;
