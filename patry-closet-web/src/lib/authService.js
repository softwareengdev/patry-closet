/**
 * Mock Authentication Service
 * Simulates backend auth API for frontend development.
 * Replace with real API calls when patry-closet-server is ready.
 */
import { jwtDecode } from 'jwt-decode';

const STORAGE_KEYS = {
    USERS: 'patry_mock_users',
    ACCESS: 'patry_access_token',
    REFRESH: 'patry_refresh_token',
    REMEMBER: 'patry_remember_me',
};

const MOCK_DELAY = 800;

const delay = (ms = MOCK_DELAY) => new Promise((r) => setTimeout(r, ms));

/* ─── Mock JWT generation (NOT real — for UI development only) ─── */
const createMockJWT = (payload, expiresInMinutes = 15) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const body = btoa(
        JSON.stringify({
            ...payload,
            iat: now,
            exp: now + expiresInMinutes * 60,
        })
    );
    const signature = btoa('mock-signature-' + Date.now());
    return `${header}.${body}.${signature}`;
};

/* ─── Stored mock users database ─── */
const getMockUsers = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    } catch {
        return [];
    }
};

const saveMockUsers = (users) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

/* ─── Default demo user (always available) ─── */
const DEMO_USER = {
    id: 'usr_demo_001',
    email: 'demo@patrycloset.com',
    password: 'Demo1234!',
    firstName: 'Patricia',
    lastName: 'García',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    phone: '+34 612 345 678',
    dateOfBirth: '1995-06-15',
    gender: 'female',
    emailVerified: true,
    twoFactorEnabled: false,
    createdAt: '2024-01-15T10:00:00Z',
    memberSince: 'January 2024',
    preferences: {
        favoriteSizes: ['S', 'M'],
        favoriteColors: ['black', 'white', 'beige'],
        favoriteBrands: ['Zara', 'Massimo Dutti'],
        favoriteCategories: ['dresses', 'shoes', 'bags'],
        stylePreferences: ['minimal', 'elegant'],
        notifications: {
            orderUpdates: true,
            promotions: true,
            stockAlerts: true,
            newArrivals: false,
            priceDrops: true,
            pushEnabled: true,
            emailEnabled: true,
        },
    },
    addresses: [
        {
            id: 'addr_001',
            label: 'Home',
            firstName: 'Patricia',
            lastName: 'García',
            street: 'Calle Gran Vía 42, 3ºB',
            apartment: '',
            city: 'Madrid',
            state: 'Madrid',
            postalCode: '28013',
            country: 'ES',
            phone: '+34 612 345 678',
            isDefault: true,
            lat: 40.4200,
            lng: -3.7025,
        },
        {
            id: 'addr_002',
            label: 'Work',
            firstName: 'Patricia',
            lastName: 'García',
            street: 'Paseo de la Castellana 89',
            apartment: 'Planta 5',
            city: 'Madrid',
            state: 'Madrid',
            postalCode: '28046',
            country: 'ES',
            phone: '+34 612 345 678',
            isDefault: false,
            lat: 40.4510,
            lng: -3.6925,
        },
    ],
};

/* ─── Mock Orders ─── */
const DEMO_ORDERS = [
    {
        id: 'ord_001',
        orderNumber: 'PC-7K3M2P',
        status: 'delivered',
        items: [
            { productId: '1', name: 'Silk Wrap Dress', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200', size: 'M', color: 'Black', quantity: 1, price: 89.99 },
            { productId: '3', name: 'Leather Crossbody Bag', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200', size: 'One Size', color: 'Tan', quantity: 1, price: 129.99 },
        ],
        subtotal: 219.98,
        discount: 22.00,
        shipping: 0,
        tax: 41.57,
        total: 239.55,
        createdAt: '2025-12-15T14:30:00Z',
        estimatedDelivery: '2025-12-22T00:00:00Z',
        trackingNumber: 'DHL-ES-7829341',
        trackingUrl: '#',
        shippingAddress: DEMO_USER.addresses[0],
        paymentMethod: { id: 'pm_001', brand: 'visa', last4: '4242', expMonth: '12', expYear: '27', isDefault: true },
    },
    {
        id: 'ord_002',
        orderNumber: 'PC-9A1B5X',
        status: 'shipped',
        items: [
            { productId: '5', name: 'Oversized Wool Coat', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=200', size: 'L', color: 'Camel', quantity: 1, price: 199.99 },
        ],
        subtotal: 199.99,
        discount: 0,
        shipping: 0,
        tax: 42.00,
        total: 241.99,
        createdAt: '2026-02-28T09:15:00Z',
        estimatedDelivery: '2026-03-07T00:00:00Z',
        trackingNumber: 'COR-ES-1234567',
        trackingUrl: '#',
        shippingAddress: DEMO_USER.addresses[0],
        paymentMethod: { id: 'pm_001', brand: 'visa', last4: '4242', expMonth: '12', expYear: '27', isDefault: true },
    },
    {
        id: 'ord_003',
        orderNumber: 'PC-3F8G2N',
        status: 'processing',
        items: [
            { productId: '2', name: 'Cashmere Turtleneck', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200', size: 'S', color: 'Cream', quantity: 2, price: 79.99 },
        ],
        subtotal: 159.98,
        discount: 16.00,
        shipping: 0,
        tax: 30.24,
        total: 174.22,
        createdAt: '2026-03-29T16:45:00Z',
        estimatedDelivery: '2026-04-05T00:00:00Z',
        trackingNumber: null,
        trackingUrl: null,
        shippingAddress: DEMO_USER.addresses[1],
        paymentMethod: { id: 'pm_002', brand: 'mastercard', last4: '8888', expMonth: '06', expYear: '28', isDefault: false },
    },
];

/* ─── Mock Payment Methods ─── */
const DEMO_PAYMENT_METHODS = [
    { id: 'pm_001', brand: 'visa', last4: '4242', expMonth: '12', expYear: '27', isDefault: true },
    { id: 'pm_002', brand: 'mastercard', last4: '8888', expMonth: '06', expYear: '28', isDefault: false },
];

/* ─── Mock Notifications ─── */
const DEMO_NOTIFICATIONS = [
    { id: 'notif_001', type: 'order', title: 'Order Shipped!', message: 'Your order PC-9A1B5X has been shipped and is on its way.', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=100', actionUrl: '/account/orders', read: false, createdAt: '2026-03-30T10:00:00Z' },
    { id: 'notif_002', type: 'stock', title: 'Back in Stock!', message: 'The Silk Wrap Dress in size S is back in stock.', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100', actionUrl: '/products/1', read: false, createdAt: '2026-03-29T15:30:00Z' },
    { id: 'notif_003', type: 'promo', title: 'Spring Sale 🌸', message: 'Up to 40% off spring collection. Use code SPRING40.', image: null, actionUrl: '/products', read: true, createdAt: '2026-03-28T09:00:00Z' },
    { id: 'notif_004', type: 'price_drop', title: 'Price Drop Alert', message: 'An item in your wishlist just dropped 20% in price!', image: null, actionUrl: '/wishlist', read: true, createdAt: '2026-03-25T12:00:00Z' },
];

/* ─── Mock Sessions ─── */
const DEMO_SESSIONS = [
    { id: 'sess_001', device: 'Chrome on Windows', location: 'Madrid, Spain', ip: '83.42.xxx.xxx', lastActive: new Date().toISOString(), isCurrent: true },
    { id: 'sess_002', device: 'Safari on iPhone', location: 'Madrid, Spain', ip: '83.42.xxx.xxx', lastActive: '2026-03-30T08:15:00Z', isCurrent: false },
];

/* ═══════════════════════════════════════════════════════
   AUTH SERVICE API
   ═══════════════════════════════════════════════════════ */

const authService = {
    /**
     * Register a new user
     */
    async register({ firstName, lastName, email, password, dateOfBirth, gender }) {
        await delay();
        const users = getMockUsers();

        if (email === DEMO_USER.email || users.find((u) => u.email === email)) {
            throw { response: { status: 409, data: { message: 'An account with this email already exists' } } };
        }

        const newUser = {
            id: 'usr_' + Math.random().toString(36).substr(2, 9),
            email,
            firstName,
            lastName,
            avatar: null,
            phone: null,
            dateOfBirth: dateOfBirth || null,
            gender: gender || null,
            emailVerified: false,
            twoFactorEnabled: false,
            createdAt: new Date().toISOString(),
            memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            preferences: {
                favoriteSizes: [],
                favoriteColors: [],
                favoriteBrands: [],
                favoriteCategories: [],
                stylePreferences: [],
                notifications: {
                    orderUpdates: true,
                    promotions: true,
                    stockAlerts: true,
                    newArrivals: true,
                    priceDrops: true,
                    pushEnabled: false,
                    emailEnabled: true,
                },
            },
            addresses: [],
            _password: password,
        };

        users.push(newUser);
        saveMockUsers(users);

        const { _password, ...userWithoutPassword } = newUser;
        const accessToken = createMockJWT({ sub: newUser.id, email }, 15);
        const refreshToken = createMockJWT({ sub: newUser.id, type: 'refresh' }, 60 * 24 * 7);

        return {
            user: userWithoutPassword,
            tokens: { accessToken, refreshToken, expiresIn: 900 },
        };
    },

    /**
     * Login with email + password
     */
    async login({ email, password, rememberMe = false }) {
        await delay();

        let user;
        if (email === DEMO_USER.email && password === DEMO_USER.password) {
            user = { ...DEMO_USER };
        } else {
            const users = getMockUsers();
            const found = users.find((u) => u.email === email && u._password === password);
            if (!found) {
                throw { response: { status: 401, data: { message: 'Invalid email or password' } } };
            }
            const { _password, ...rest } = found;
            user = rest;
        }

        const expiresIn = rememberMe ? 60 * 24 * 30 : 15;
        const accessToken = createMockJWT({ sub: user.id, email: user.email }, expiresIn);
        const refreshToken = createMockJWT(
            { sub: user.id, type: 'refresh' },
            rememberMe ? 60 * 24 * 30 : 60 * 24 * 7
        );

        if (rememberMe) {
            localStorage.setItem(STORAGE_KEYS.REMEMBER, 'true');
        }

        return {
            user,
            tokens: { accessToken, refreshToken, expiresIn: expiresIn * 60 },
        };
    },

    /**
     * Logout
     */
    async logout() {
        await delay(300);
        localStorage.removeItem(STORAGE_KEYS.ACCESS);
        localStorage.removeItem(STORAGE_KEYS.REFRESH);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER);
    },

    /**
     * Logout from all devices
     */
    async logoutAllDevices() {
        await delay();
        localStorage.removeItem(STORAGE_KEYS.ACCESS);
        localStorage.removeItem(STORAGE_KEYS.REFRESH);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER);
        return { message: 'Logged out from all devices' };
    },

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        await delay(200);
        try {
            const decoded = JSON.parse(atob(refreshToken.split('.')[1]));
            if (decoded.exp < Date.now() / 1000) {
                throw new Error('Refresh token expired');
            }
            const newAccessToken = createMockJWT({ sub: decoded.sub }, 15);
            const newRefreshToken = createMockJWT({ sub: decoded.sub, type: 'refresh' }, 60 * 24 * 7);
            return { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: 900 };
        } catch {
            throw { response: { status: 401, data: { message: 'Invalid refresh token' } } };
        }
    },

    /**
     * Get current user profile
     */
    async getProfile() {
        await delay(400);
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS);
        if (!token) throw { response: { status: 401 } };

        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            if (decoded.email === DEMO_USER.email) {
                const { password, ...user } = DEMO_USER;
                return user;
            }
            const users = getMockUsers();
            const found = users.find((u) => u.id === decoded.sub);
            if (!found) throw { response: { status: 404 } };
            const { _password, ...rest } = found;
            return rest;
        } catch (e) {
            if (e.response) throw e;
            throw { response: { status: 401 } };
        }
    },

    /**
     * Update profile
     */
    async updateProfile(updates) {
        await delay();
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS);
        if (!token) throw { response: { status: 401 } };

        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.email === DEMO_USER.email || decoded.sub === DEMO_USER.id) {
            return { ...DEMO_USER, ...updates, password: undefined };
        }

        const users = getMockUsers();
        const idx = users.findIndex((u) => u.id === decoded.sub);
        if (idx === -1) throw { response: { status: 404 } };
        users[idx] = { ...users[idx], ...updates };
        saveMockUsers(users);
        const { _password, ...rest } = users[idx];
        return rest;
    },

    /**
     * Upload avatar (mock — returns same URL)
     */
    async uploadAvatar(file) {
        await delay(1200);
        const url = URL.createObjectURL(file);
        return { avatar: url };
    },

    /**
     * Forgot password — send reset email
     */
    async forgotPassword(email) {
        await delay();
        // Always return success to prevent email enumeration
        return { message: 'If an account exists with that email, a password reset link has been sent.' };
    },

    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword) {
        await delay();
        // Mock: always succeeds if token is present
        if (!token) throw { response: { status: 400, data: { message: 'Invalid or expired reset token' } } };
        return { message: 'Password has been reset successfully' };
    },

    /**
     * Verify email with token
     */
    async verifyEmail(token) {
        await delay();
        if (!token) throw { response: { status: 400, data: { message: 'Invalid verification token' } } };
        return { message: 'Email verified successfully', verified: true };
    },

    /**
     * Resend verification email
     */
    async resendVerification(email) {
        await delay();
        return { message: 'Verification email sent' };
    },

    /**
     * Social login (Google/Apple)
     */
    async socialLogin(provider) {
        await delay(1200);
        // Mock: simulate successful social auth → creates/returns demo user
        const user = {
            ...DEMO_USER,
            id: 'usr_social_' + provider,
            email: `demo.${provider}@patrycloset.com`,
            firstName: provider === 'google' ? 'Google' : 'Apple',
            lastName: 'User',
            emailVerified: true,
        };
        const accessToken = createMockJWT({ sub: user.id, email: user.email }, 15);
        const refreshToken = createMockJWT({ sub: user.id, type: 'refresh' }, 60 * 24 * 7);
        return { user, tokens: { accessToken, refreshToken, expiresIn: 900 } };
    },

    /* ─── Account data endpoints ─── */

    async getOrders() {
        await delay(600);
        return DEMO_ORDERS;
    },

    async getPaymentMethods() {
        await delay(400);
        return DEMO_PAYMENT_METHODS;
    },

    async addPaymentMethod(/* cardData */) {
        await delay(800);
        const newPM = { id: 'pm_' + Math.random().toString(36).substr(2, 6), brand: 'visa', last4: String(Math.floor(1000 + Math.random() * 9000)), expMonth: '12', expYear: '29', isDefault: false };
        DEMO_PAYMENT_METHODS.push(newPM);
        return newPM;
    },

    async removePaymentMethod(id) {
        await delay(400);
        const idx = DEMO_PAYMENT_METHODS.findIndex((pm) => pm.id === id);
        if (idx !== -1) DEMO_PAYMENT_METHODS.splice(idx, 1);
        return { success: true };
    },

    async setDefaultPaymentMethod(id) {
        await delay(300);
        DEMO_PAYMENT_METHODS.forEach((pm) => (pm.isDefault = pm.id === id));
        return DEMO_PAYMENT_METHODS;
    },

    async getNotifications() {
        await delay(400);
        return DEMO_NOTIFICATIONS;
    },

    async markNotificationRead(id) {
        await delay(200);
        const n = DEMO_NOTIFICATIONS.find((n) => n.id === id);
        if (n) n.read = true;
        return { success: true };
    },

    async markAllNotificationsRead() {
        await delay(300);
        DEMO_NOTIFICATIONS.forEach((n) => (n.read = true));
        return { success: true };
    },

    async getSessions() {
        await delay(400);
        return DEMO_SESSIONS;
    },

    async revokeSession(id) {
        await delay(400);
        const idx = DEMO_SESSIONS.findIndex((s) => s.id === id);
        if (idx !== -1) DEMO_SESSIONS.splice(idx, 1);
        return { success: true };
    },

    async updateAddresses(addresses) {
        await delay();
        return addresses;
    },

    async updatePreferences(preferences) {
        await delay();
        return preferences;
    },
};

export default authService;
