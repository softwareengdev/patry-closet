/**
 * Addresses API Service
 * Handles address-related API calls to the backend.
 */
import api from './api';

const addressesApi = {
    /**
     * Get all addresses for the current user.
     */
    async getAddresses() {
        const { data } = await api.get('/v1/addresses');
        return data.data;
    },

    /**
     * Get a single address.
     */
    async getAddress(addressId) {
        const { data } = await api.get(`/v1/addresses/${addressId}`);
        return data.data;
    },

    /**
     * Create a new address. Returns the created address.
     */
    async createAddress(addressData) {
        const { data } = await api.post('/v1/addresses', addressData);
        return data.data;
    },

    /**
     * Update an existing address.
     */
    async updateAddress(addressId, addressData) {
        const { data } = await api.put(`/v1/addresses/${addressId}`, addressData);
        return data.data;
    },

    /**
     * Delete an address.
     */
    async deleteAddress(addressId) {
        await api.delete(`/v1/addresses/${addressId}`);
    },

    /**
     * Set an address as default.
     */
    async setDefault(addressId) {
        const { data } = await api.put(`/v1/addresses/${addressId}/default`);
        return data.data;
    },
};

export default addressesApi;
