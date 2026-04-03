import { useContext, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturedProducts from './components/FeaturedProducts';
import CuratedStories from './components/CuratedStories';
import ProductsPage from './components/ProductsPage';
import ProductDetail from './components/ProductDetail';
import ContactSection from './components/ContactSection';
import FooterSection from './components/FooterSection';
import Cart from './components/Cart';
import WishlistPage from './components/WishlistPage';
import Checkout from './components/Checkout';
import CookieConsent from './components/CookieConsent';
import SEOHead, { getOrganizationSchema, getWebSiteSchema } from './components/SEOHead';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AccountPage from './pages/AccountPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Code-split legal & blog pages (loaded on demand)
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

    const homeJsonLd = [getOrganizationSchema(), getWebSiteSchema()];

    return (
        <div className={`w-full min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-gray-950 text-white' : 'bg-warm-100 text-gray-900'} ${isHighContrast ? 'high-contrast' : ''}`}>
            <SkipToContent />
            <CookieConsent />
            {showNavbar && <Navbar isTransparent={isHome} />}
            <main id="main-content" className={isHome || isAuthPage ? 'w-full' : 'pt-20 w-full'} role="main" tabIndex={-1}>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={
                            <motion.div {...pageTransition}>
                                <SEOHead
                                    title="Moda Online — Colecciones Exclusivas"
                                    description="PATRY♡CLOSET — Tienda de moda online con colecciones exclusivas para mujer, hombre y accesorios. Envío gratuito en pedidos +50€. Descubre las últimas tendencias."
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
                            <motion.div {...pageTransition}><ProductsPage /></motion.div>
                        } />
                        <Route path="/products/:id" element={
                            <motion.div {...pageTransition}><ProductDetail /></motion.div>
                        } />
                        <Route path="/cart" element={
                            <motion.div {...pageTransition}><Cart /></motion.div>
                        } />
                        <Route path="/wishlist" element={
                            <motion.div {...pageTransition}><WishlistPage /></motion.div>
                        } />
                        <Route path="/checkout" element={
                            <motion.div {...pageTransition}><Checkout /></motion.div>
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
                            <motion.div {...pageTransition}><LoginPage /></motion.div>
                        } />
                        <Route path="/register" element={
                            <motion.div {...pageTransition}><RegisterPage /></motion.div>
                        } />
                        <Route path="/forgot-password" element={
                            <motion.div {...pageTransition}><ForgotPasswordPage /></motion.div>
                        } />
                        <Route path="/account/verify-email" element={
                            <motion.div {...pageTransition}><VerifyEmailPage /></motion.div>
                        } />

                        {/* Protected routes */}
                        <Route path="/account" element={
                            <motion.div {...pageTransition}>
                                <ProtectedRoute><AccountPage /></ProtectedRoute>
                            </motion.div>
                        } />
                        <Route path="/account/*" element={
                            <motion.div {...pageTransition}>
                                <ProtectedRoute><AccountPage /></ProtectedRoute>
                            </motion.div>
                        } />
                    </Routes>
                </AnimatePresence>
            </main>
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <WishlistProvider>
                    <CartProvider>
                        <AppContent />
                    </CartProvider>
                </WishlistProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;