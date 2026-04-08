import { useContext, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturedProducts from './components/FeaturedProducts';
import CuratedStories from './components/CuratedStories';
import ContactSection from './components/ContactSection';
import FooterSection from './components/FooterSection';
import CookieConsent from './components/CookieConsent';
import ErrorBoundary from './components/ErrorBoundary';
import SEOHead, { getOrganizationSchema, getWebSiteSchema, getLocalBusinessSchema, getBrandSchema, getPersonSchema } from './components/SEOHead';

import ProtectedRoute from './components/auth/ProtectedRoute';

// Code-split route pages (loaded on demand)
const ProductsPage = lazy(() => import('./components/ProductsPage'));
const ProductDetail = lazy(() => import('./components/ProductDetail'));
const Cart = lazy(() => import('./components/Cart'));
const WishlistPage = lazy(() => import('./components/WishlistPage'));
const Checkout = lazy(() => import('./components/Checkout'));

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));

const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const CookiesPage = lazy(() => import('./pages/CookiesPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import usePageTracking from './hooks/usePageTracking';

// Eagerly loaded skeleton fallbacks (tiny components, no code-splitting needed)
import ProductsPageSkeleton from './components/ui/ProductsPageSkeleton';
import ProductDetailSkeleton from './components/ui/ProductDetailSkeleton';
import AccountSkeleton from './components/ui/AccountSkeleton';

const pageTransition = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
);

/* ─── Scroll to top on route change ─── */
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

/* ─── Skip to content link (A11Y) ─── */
const SkipToContent = () => (
    <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent-900 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg"
    >
        Skip to main content
    </a>
);

function AppContent() {
    const { isDark, isHighContrast } = useContext(ThemeContext);
    const location = useLocation();
    const isHome = location.pathname === '/';
    const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname) || location.pathname.startsWith('/account/verify-email');
    const showNavbar = !isAuthPage;

    usePageTracking();

    const homeJsonLd = [getOrganizationSchema(), getWebSiteSchema(), getLocalBusinessSchema(), getBrandSchema(), getPersonSchema()];

    return (
        <div className={`w-full min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-gray-950 text-white' : 'bg-warm-100 text-gray-900'} ${isHighContrast ? 'high-contrast' : ''}`}>
            <ScrollToTop />
            <SkipToContent />
            <CookieConsent />
            {showNavbar && <Navbar isTransparent={isHome} />}
            <main id="main-content" className={isHome || isAuthPage ? 'w-full' : 'pt-20 w-full'} role="main" tabIndex={-1}>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={
                            <motion.div {...pageTransition}>
                                <SEOHead
                                    title="Tienda de Moda Online Premium — Ropa Mujer, Vestidos, Accesorios"
                                    description="PATRY♡CLOSET — Tu tienda de moda online premium en España. Colecciones exclusivas de ropa de mujer: vestidos, tops, pantalones, bolsos, zapatos y accesorios de las últimas tendencias. Envío gratuito en pedidos +50€. Descubre tu estilo con Patricia."
                                    canonical="/"
                                    jsonLd={homeJsonLd}
                                />
                                <HeroSection />
                                <FeaturedProducts />
                                <CuratedStories />
                                <ContactSection />
                                <FooterSection />
                            </motion.div>
                        } />
                        <Route path="/products" element={
                            <motion.div {...pageTransition}><Suspense fallback={<ProductsPageSkeleton />}><ErrorBoundary><ProductsPage /></ErrorBoundary></Suspense></motion.div>
                        } />
                        <Route path="/products/:id" element={
                            <motion.div {...pageTransition}><Suspense fallback={<ProductDetailSkeleton />}><ErrorBoundary><ProductDetail /></ErrorBoundary></Suspense></motion.div>
                        } />
                        <Route path="/cart" element={
                            <motion.div {...pageTransition}><Suspense fallback={<PageLoader />}><ErrorBoundary><Cart /></ErrorBoundary></Suspense></motion.div>
                        } />
                        <Route path="/wishlist" element={
                            <motion.div {...pageTransition}><Suspense fallback={<PageLoader />}><ErrorBoundary><WishlistPage /></ErrorBoundary></Suspense></motion.div>
                        } />
                        <Route path="/checkout" element={
                            <motion.div {...pageTransition}><Suspense fallback={<PageLoader />}><ErrorBoundary><Checkout /></ErrorBoundary></Suspense></motion.div>
                        } />
                        <Route path="/blog" element={
                            <motion.div {...pageTransition}><Suspense fallback={<PageLoader />}><BlogPage /></Suspense></motion.div>
                        } />
                        <Route path="/blog/:slug" element={
                            <motion.div {...pageTransition}><Suspense fallback={<PageLoader />}><BlogPostPage /></Suspense></motion.div>
                        } />

                        {/* Legal pages */}
                        <Route path="/terms" element={
                            <motion.div {...pageTransition}><Suspense fallback={<PageLoader />}><TermsPage /></Suspense></motion.div>
                        } />
                        <Route path="/privacy" element={
                            <motion.div {...pageTransition}><Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense></motion.div>
                        } />
                        <Route path="/cookies" element={
                            <motion.div {...pageTransition}><Suspense fallback={<PageLoader />}><CookiesPage /></Suspense></motion.div>
                        } />
                        <Route path="/faq" element={
                            <motion.div {...pageTransition}><Suspense fallback={<PageLoader />}><FAQPage /></Suspense></motion.div>
                        } />

                        {/* Auth routes */}
                        <Route path="/login" element={
                            <motion.div {...pageTransition}><Suspense fallback={<PageLoader />}><LoginPage /></Suspense></motion.div>
                        } />
                        <Route path="/register" element={
                            <motion.div {...pageTransition}><Suspense fallback={<PageLoader />}><RegisterPage /></Suspense></motion.div>
                        } />
                        <Route path="/forgot-password" element={
                            <motion.div {...pageTransition}><Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense></motion.div>
                        } />
                        <Route path="/account/verify-email" element={
                            <motion.div {...pageTransition}><Suspense fallback={<PageLoader />}><VerifyEmailPage /></Suspense></motion.div>
                        } />

                        {/* Protected routes */}
                        <Route path="/account" element={
                            <motion.div {...pageTransition}>
                                <Suspense fallback={<AccountSkeleton />}><ProtectedRoute><AccountPage /></ProtectedRoute></Suspense>
                            </motion.div>
                        } />
                        <Route path="/account/*" element={
                            <motion.div {...pageTransition}>
                                <Suspense fallback={<AccountSkeleton />}><ProtectedRoute><AccountPage /></ProtectedRoute></Suspense>
                            </motion.div>
                        } />
                    </Routes>
                </AnimatePresence>
            </main>
        </div>
    );
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleProviderWrapper({ children }) {
    if (!GOOGLE_CLIENT_ID) return children;
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            {children}
        </GoogleOAuthProvider>
    );
}

function App() {
    return (
        <GoogleProviderWrapper>
            <ThemeProvider>
                <AuthProvider>
                    <WishlistProvider>
                        <CartProvider>
                            <AppContent />
                        </CartProvider>
                    </WishlistProvider>
                </AuthProvider>
            </ThemeProvider>
        </GoogleProviderWrapper>
    );
}

export default App;