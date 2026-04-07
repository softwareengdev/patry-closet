import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './utils';

// Mock dependencies used by auth components
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

vi.mock('../lib/validationSchemas', () => ({
    loginSchema: {
        parse: vi.fn(),
        safeParse: vi.fn(() => ({ success: true })),
    },
    registerSchema: {
        parse: vi.fn(),
        safeParse: vi.fn(() => ({ success: true })),
    },
    forgotPasswordSchema: {
        parse: vi.fn(),
        safeParse: vi.fn(() => ({ success: true })),
    },
    resetPasswordSchema: {
        parse: vi.fn(),
        safeParse: vi.fn(() => ({ success: true })),
    },
    getPasswordStrength: vi.fn(() => ({ score: 0, label: '', color: '' })),
}));

// Mock react-hook-form's zodResolver to avoid actual zod validation
vi.mock('@hookform/resolvers/zod', () => ({
    zodResolver: () => () => ({ values: {}, errors: {} }),
}));

import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import authService from '../lib/authService';

function renderWithAuth(ui) {
    return renderWithProviders(
        <AuthProvider>
            <WishlistProvider>
                <CartProvider>
                    {ui}
                </CartProvider>
            </WishlistProvider>
        </AuthProvider>
    );
}

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders email and password form fields', async () => {
        renderWithAuth(<LoginPage />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        });
    });

    it('renders PATRY♡CLOSET branding', async () => {
        renderWithAuth(<LoginPage />);
        await waitFor(() => {
            expect(screen.getByText(/PATRY/)).toBeInTheDocument();
            expect(screen.getByText('♡')).toBeInTheDocument();
            expect(screen.getByText(/CLOSET/)).toBeInTheDocument();
        });
    });

    it('renders social login buttons for Google and Apple', async () => {
        renderWithAuth(<LoginPage />);
        await waitFor(() => {
            expect(screen.getByText(/Google/)).toBeInTheDocument();
            expect(screen.getByText(/Apple/)).toBeInTheDocument();
        });
    });

    it('has link to register page', async () => {
        renderWithAuth(<LoginPage />);
        await waitFor(() => {
            expect(screen.getByText('Create Account')).toBeInTheDocument();
            expect(screen.getByText('Create Account').closest('a')).toHaveAttribute('href', '/register');
        });
    });

    it('renders Sign In submit button', async () => {
        renderWithAuth(<LoginPage />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        });
    });

    it('renders forgot password link', async () => {
        renderWithAuth(<LoginPage />);
        await waitFor(() => {
            expect(screen.getByText('Forgot password?')).toBeInTheDocument();
        });
    });
});

describe('RegisterPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with first name, last name, and email fields on step 1', async () => {
        renderWithAuth(<RegisterPage />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Patricia')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('García')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
        });
    });

    it('renders PATRY♡CLOSET branding', async () => {
        renderWithAuth(<RegisterPage />);
        await waitFor(() => {
            expect(screen.getByText(/PATRY/)).toBeInTheDocument();
            expect(screen.getByText(/CLOSET/)).toBeInTheDocument();
        });
    });

    it('has link to login page', async () => {
        renderWithAuth(<RegisterPage />);
        await waitFor(() => {
            const signInLink = screen.getByText('Sign In');
            expect(signInLink.closest('a')).toHaveAttribute('href', '/login');
        });
    });

    it('renders social login buttons on step 1', async () => {
        renderWithAuth(<RegisterPage />);
        await waitFor(() => {
            expect(screen.getByText(/Google/)).toBeInTheDocument();
            expect(screen.getByText(/Apple/)).toBeInTheDocument();
        });
    });
});

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders email field for password reset', async () => {
        renderWithAuth(<ForgotPasswordPage />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
        });
    });

    it('renders forgot password title', async () => {
        renderWithAuth(<ForgotPasswordPage />);
        await waitFor(() => {
            expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
        });
    });

    it('renders send reset link button', async () => {
        renderWithAuth(<ForgotPasswordPage />);
        await waitFor(() => {
            expect(screen.getByText('Send Reset Link')).toBeInTheDocument();
        });
    });

    it('has back to sign in link', async () => {
        renderWithAuth(<ForgotPasswordPage />);
        await waitFor(() => {
            expect(screen.getByText('Back to Sign In')).toBeInTheDocument();
        });
    });
});
