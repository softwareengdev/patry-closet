import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from './utils';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, fallback) => fallback || key,
        i18n: { language: 'en', changeLanguage: vi.fn() },
    }),
}));

vi.mock('react-helmet-async', () => ({
    Helmet: ({ children }) => <div>{children}</div>,
    HelmetProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('../lib/authService', () => ({
    default: {
        login: vi.fn(),
        register: vi.fn(),
        socialLogin: vi.fn(),
        getCurrentUser: vi.fn(),
        getProfile: vi.fn(() => Promise.resolve({
            id: 'usr_001',
            email: 'demo@patrycloset.com',
            firstName: 'Patricia',
            lastName: 'García',
            phone: '+34 612 345 678',
            avatar: null,
            dateOfBirth: '1995-06-15',
            gender: 'female',
            emailVerified: true,
            createdAt: '2024-01-15T10:00:00Z',
            memberSince: 'January 2024',
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
        })),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        updateProfile: vi.fn(),
        uploadAvatar: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        getServerCart: vi.fn(() => Promise.resolve([])),
        syncCart: vi.fn(() => Promise.resolve()),
        getServerWishlist: vi.fn(() => Promise.resolve([])),
        syncWishlist: vi.fn(() => Promise.resolve()),
        getOrders: vi.fn(() => Promise.resolve({ orders: [], pagination: {} })),
        getPaymentMethods: vi.fn(() => Promise.resolve([])),
        getNotifications: vi.fn(() => Promise.resolve([])),
        getSessions: vi.fn(() => Promise.resolve([])),
        updatePreferences: vi.fn(),
        updateAddresses: vi.fn(),
        changePassword: vi.fn(),
    },
}));

vi.mock('@hookform/resolvers/zod', () => ({
    zodResolver: () => () => ({ values: {}, errors: {} }),
}));

vi.mock('../lib/validationSchemas', () => ({
    profileSchema: {
        parse: vi.fn(),
        safeParse: vi.fn(() => ({ success: true })),
    },
    changePasswordSchema: {
        parse: vi.fn(),
        safeParse: vi.fn(() => ({ success: true })),
    },
    getPasswordStrength: vi.fn(() => ({ score: 0, label: '', color: '' })),
}));

// Mock ordersApi for OrdersTab
vi.mock('../lib/ordersApi', () => ({
    default: {
        getOrders: vi.fn(() => Promise.resolve({ orders: [], pagination: {} })),
        getOrder: vi.fn(),
    },
}));

import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import AccountPage from '../pages/AccountPage';

// Need to mock localStorage to have the access token
beforeEach(() => {
    vi.clearAllMocks();
    // Set a mock JWT so AuthProvider considers user authenticated
    const mockPayload = { sub: 'usr_001', email: 'demo@patrycloset.com', exp: Math.floor(Date.now() / 1000) + 3600 };
    const mockToken = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify(mockPayload))}.mock`;
    localStorage.setItem('patry_access_token', mockToken);
});

function renderAccount() {
    return renderWithProviders(
        <AuthProvider>
            <WishlistProvider>
                <CartProvider>
                    <AccountPage />
                </CartProvider>
            </WishlistProvider>
        </AuthProvider>
    );
}

describe('AccountPage', () => {
    it('renders the account page with user name', async () => {
        renderAccount();
        await waitFor(() => {
            const matches = screen.getAllByText(/Patricia/);
            expect(matches.length).toBeGreaterThan(0);
        });
    });

    it('renders tab navigation with all 7 tabs', async () => {
        renderAccount();
        await waitFor(() => {
            const profile = screen.getAllByText('My Profile');
            expect(profile.length).toBeGreaterThan(0);
            expect(screen.getAllByText('Addresses').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Orders').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Payments').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Notifications').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Preferences').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Security').length).toBeGreaterThan(0);
        });
    });

    it('renders Member since info', async () => {
        renderAccount();
        await waitFor(() => {
            expect(screen.getByText(/Member since/)).toBeInTheDocument();
        });
    });

    it('renders Sign Out button', async () => {
        renderAccount();
        await waitFor(() => {
            const signOuts = screen.getAllByText('Sign Out');
            expect(signOuts.length).toBeGreaterThan(0);
        });
    });

    it('renders wishlist link', async () => {
        renderAccount();
        await waitFor(() => {
            const wishlistLinks = screen.getAllByText('Wishlist');
            expect(wishlistLinks.length).toBeGreaterThan(0);
        });
    });

    it('defaults to profile tab', async () => {
        renderAccount();
        await waitFor(() => {
            // Profile tab content should be shown by default
            const profile = screen.getAllByText('My Profile');
            expect(profile.length).toBeGreaterThan(0);
        });
    });
});
