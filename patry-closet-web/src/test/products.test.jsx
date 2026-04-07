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
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        getServerCart: vi.fn(() => Promise.resolve([])),
        syncCart: vi.fn(() => Promise.resolve()),
        getServerWishlist: vi.fn(() => Promise.resolve([])),
        syncWishlist: vi.fn(() => Promise.resolve()),
    },
}));

// Mock productsApi
vi.mock('../lib/productsApi', () => ({
    default: {
        getProducts: vi.fn(() => Promise.resolve({
            data: [
                { id: '1', name: 'Silk Wrap Dress', price: 89.99, image: 'dress.jpg', category: 'dresses', brand: 'Zara', colors: ['black'], sizes: ['S', 'M'], rating: 4.5, reviewCount: 10, popularity: 95, inStock: true, badge: 'new' },
                { id: '2', name: 'Leather Bag', price: 129.99, image: 'bag.jpg', category: 'bags', brand: 'Massimo Dutti', colors: ['tan'], sizes: [], rating: 4.8, reviewCount: 25, popularity: 90, inStock: true, badge: 'bestSeller' },
            ],
            pagination: { currentPage: 1, totalPages: 1, pageSize: 20, totalCount: 2 },
        })),
        getCategories: vi.fn(() => Promise.resolve([
            { name: 'dresses', subcategories: [] },
            { name: 'bags', subcategories: [] },
        ])),
        getFeaturedProducts: vi.fn(() => Promise.resolve([])),
        getRelatedProducts: vi.fn(() => Promise.resolve([])),
        getProductBySlug: vi.fn(),
    },
    getProducts: vi.fn(() => Promise.resolve({
        data: [
            { id: '1', name: 'Silk Wrap Dress', price: 89.99, image: 'dress.jpg', category: 'dresses', brand: 'Zara', colors: ['black'], sizes: ['S', 'M'], rating: 4.5, reviewCount: 10, popularity: 95, inStock: true, badge: 'new' },
            { id: '2', name: 'Leather Bag', price: 129.99, image: 'bag.jpg', category: 'bags', brand: 'Massimo Dutti', colors: ['tan'], sizes: [], rating: 4.8, reviewCount: 25, popularity: 90, inStock: true, badge: 'bestSeller' },
        ],
        pagination: { currentPage: 1, totalPages: 1, pageSize: 20, totalCount: 2 },
    })),
    getCategories: vi.fn(() => Promise.resolve([
        { name: 'dresses', subcategories: [] },
        { name: 'bags', subcategories: [] },
    ])),
}));

// Mock Swiper (not needed but some components may import it)
vi.mock('swiper/react', () => ({
    Swiper: ({ children }) => <div>{children}</div>,
    SwiperSlide: ({ children }) => <div>{children}</div>,
}));
vi.mock('swiper/modules', () => ({
    Autoplay: {},
    EffectFade: {},
    Pagination: {},
    Navigation: {},
    Parallax: {},
}));
vi.mock('swiper/css', () => ({}));
vi.mock('swiper/css/effect-fade', () => ({}));
vi.mock('swiper/css/pagination', () => ({}));
vi.mock('swiper/css/navigation', () => ({}));
vi.mock('swiper/css/parallax', () => ({}));

// Mock react-slider
vi.mock('react-slider', () => ({
    default: (props) => <div data-testid="price-slider">Slider</div>,
}));

// Mock tanstack query
vi.mock('@tanstack/react-query', () => ({
    useQuery: vi.fn(({ queryKey }) => {
        if (queryKey[0] === 'products') {
            return {
                data: {
                    data: [
                        { id: '1', name: 'Silk Wrap Dress', price: 89.99, image: 'dress.jpg', category: 'dresses' },
                        { id: '2', name: 'Leather Bag', price: 129.99, image: 'bag.jpg', category: 'bags' },
                    ],
                    pagination: { currentPage: 1, totalPages: 1, totalCount: 2 },
                },
                isLoading: false,
                isError: false,
                error: null,
            };
        }
        if (queryKey[0] === 'categories') {
            return {
                data: [
                    { name: 'dresses', subcategories: [] },
                    { name: 'bags', subcategories: [] },
                ],
                isLoading: false,
                isError: false,
            };
        }
        return { data: null, isLoading: false, isError: false };
    }),
    useQueryClient: vi.fn(() => ({
        prefetchQuery: vi.fn(),
    })),
    QueryClient: vi.fn(() => ({
        prefetchQuery: vi.fn(),
    })),
    QueryClientProvider: ({ children }) => <div>{children}</div>,
}));

import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import ProductsPage from '../components/ProductsPage';

function renderProducts() {
    return renderWithProviders(
        <AuthProvider>
            <WishlistProvider>
                <CartProvider>
                    <ProductsPage />
                </CartProvider>
            </WishlistProvider>
        </AuthProvider>
    );
}

describe('ProductsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the products page section', async () => {
        renderProducts();
        await waitFor(() => {
            // ProductsPage renders a section with aria-label
            const section = screen.getByLabelText('productCatalog');
            expect(section).toBeInTheDocument();
        });
    });

    it('renders sort dropdown', async () => {
        renderProducts();
        await waitFor(() => {
            // The sort select has aria-label="sortBy"
            const sortSelect = screen.getByLabelText('sortBy');
            expect(sortSelect).toBeInTheDocument();
        });
    });

    it('renders filter button', async () => {
        renderProducts();
        await waitFor(() => {
            // Mobile filter button with aria-label="Open filters"
            const filterButton = screen.getByLabelText('Open filters');
            expect(filterButton).toBeInTheDocument();
        });
    });

    it('renders view mode toggle buttons', async () => {
        renderProducts();
        await waitFor(() => {
            // Grid view buttons (may appear in filter sidebar and top bar)
            const gridBtns = screen.getAllByLabelText('Grid view');
            expect(gridBtns.length).toBeGreaterThan(0);
        });
    });

    it('renders product results count', async () => {
        renderProducts();
        await waitFor(() => {
            // The sr-only results announcement
            const srAnnouncement = screen.getByRole('status');
            expect(srAnnouncement).toBeInTheDocument();
        });
    });
});
