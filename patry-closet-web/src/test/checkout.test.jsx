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
        getProfile: vi.fn(() => Promise.reject(new Error('no token'))),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        getServerCart: vi.fn(() => Promise.resolve([])),
        syncCart: vi.fn(() => Promise.resolve()),
        getServerWishlist: vi.fn(() => Promise.resolve([])),
        syncWishlist: vi.fn(() => Promise.resolve()),
    },
}));

vi.mock('@stripe/stripe-js', () => ({
    loadStripe: vi.fn(() => Promise.resolve({
        elements: vi.fn(),
        confirmCardPayment: vi.fn(() => Promise.resolve({ paymentIntent: { id: 'pi_test', status: 'succeeded' } })),
    })),
}));

vi.mock('@stripe/react-stripe-js', () => ({
    Elements: ({ children }) => <div>{children}</div>,
    CardElement: (props) => <div data-testid="stripe-card-element">Card</div>,
    useStripe: () => ({
        confirmCardPayment: vi.fn(() => Promise.resolve({ paymentIntent: { id: 'pi_test', status: 'succeeded' } })),
    }),
    useElements: () => ({ getElement: vi.fn(() => ({})) }),
}));

vi.mock('../lib/paymentsApi', () => ({
    default: {
        createCheckout: vi.fn(() => Promise.resolve({
            clientSecret: 'cs_test',
            orderId: 'ord_1',
            orderNumber: 'PC-TEST01',
            amount: 5000,
        })),
        confirmPayment: vi.fn(() => Promise.resolve({})),
    },
}));

vi.mock('../lib/addressesApi', () => ({
    default: {
        createAddress: vi.fn(() => Promise.resolve({ id: 'addr_1' })),
        getAddresses: vi.fn(() => Promise.resolve([])),
    },
}));

vi.mock('../lib/cartApi', () => ({
    default: {
        syncLocalCartToServer: vi.fn(() => Promise.resolve()),
    },
}));

import { AuthProvider } from '../context/AuthContext';
import { CartProvider, useCart, CartContext } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import Checkout from '../components/Checkout';

function renderCheckout(cartItems = []) {
    // Provide cart context with items for the test
    const cartValue = {
        cartItems,
        coupon: null,
        miniCartOpen: false,
        setMiniCartOpen: vi.fn(),
        flyToCartAnimation: null,
        isMerging: false,
        addToCart: vi.fn(),
        removeFromCart: vi.fn(),
        updateQuantity: vi.fn(),
        clearCart: vi.fn(),
        getTotal: () => cartItems.reduce((s, i) => s + i.price * i.quantity, 0),
        getSubtotal: () => cartItems.reduce((s, i) => s + i.price * i.quantity, 0),
        getItemCount: () => cartItems.reduce((c, i) => c + i.quantity, 0),
        getShipping: () => 0,
        getTax: () => cartItems.reduce((s, i) => s + i.price * i.quantity, 0) * 0.21,
        getDiscount: () => 0,
        getGrandTotal: () => {
            const sub = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
            return sub + sub * 0.21;
        },
        applyCoupon: vi.fn(() => ({ success: false, message: 'No coupon' })),
        removeCoupon: vi.fn(),
        triggerFlyToCart: vi.fn(),
    };

    return renderWithProviders(
        <AuthProvider>
            <WishlistProvider>
                <CartContext.Provider value={cartValue}>
                    <Checkout />
                </CartContext.Provider>
            </WishlistProvider>
        </AuthProvider>
    );
}

const sampleCartItems = [
    { id: '1', name: 'Silk Dress', price: 89.99, image: 'dress.jpg', size: 'M', color: 'Black', quantity: 1 },
    { id: '2', name: 'Leather Bag', price: 129.99, image: 'bag.jpg', size: 'One Size', color: 'Tan', quantity: 1 },
];

describe('Checkout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows empty cart message when cart has no items', async () => {
        renderCheckout([]);
        await waitFor(() => {
            // t('emptyCart') returns 'emptyCart' (the key) since our mock returns keys
            expect(screen.getByText('emptyCart')).toBeInTheDocument();
        });
    });

    it('shows Shop Now link when cart is empty', async () => {
        renderCheckout([]);
        await waitFor(() => {
            // t('shopNow') returns 'shopNow'
            expect(screen.getByText('shopNow')).toBeInTheDocument();
        });
    });

    it('renders shipping form when cart has items', async () => {
        renderCheckout(sampleCartItems);
        await waitFor(() => {
            // t('shippingInfo') returns 'shippingInfo'
            expect(screen.getByText('shippingInfo')).toBeInTheDocument();
        });
    });

    it('renders shipping form fields', async () => {
        renderCheckout(sampleCartItems);
        await waitFor(() => {
            // The FormField uses aria-label with the label text
            expect(screen.getByLabelText('email')).toBeInTheDocument();
            expect(screen.getByLabelText('firstName')).toBeInTheDocument();
            expect(screen.getByLabelText('lastName')).toBeInTheDocument();
        });
    });

    it('renders Continue to Payment button', async () => {
        renderCheckout(sampleCartItems);
        await waitFor(() => {
            expect(screen.getByText('continueToPayment')).toBeInTheDocument();
        });
    });

    it('renders order summary showing items', async () => {
        renderCheckout(sampleCartItems);
        await waitFor(() => {
            expect(screen.getByText('Silk Dress')).toBeInTheDocument();
            expect(screen.getByText('Leather Bag')).toBeInTheDocument();
        });
    });

    it('renders step indicator with shipping, payment, confirmation steps', async () => {
        renderCheckout(sampleCartItems);
        await waitFor(() => {
            // Step indicator should show the checkout progress
            const nav = screen.getByRole('status');
            expect(nav).toBeInTheDocument();
        });
    });
});
