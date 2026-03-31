import { useContext } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturedProducts from './components/FeaturedProducts';
import ProductsPage from './components/ProductsPage';
import ProductDetail from './components/ProductDetail';
import ContactSection from './components/ContactSection';
import Cart from './components/Cart';
import Blog from './components/Blog';

import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';

const pageTransition = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

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

    return (
        <div className={`w-full min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'} ${isHighContrast ? 'high-contrast' : ''}`}>
            <SkipToContent />
            <Navbar isTransparent={isHome} />
            <main id="main-content" className={isHome ? 'w-full' : 'pt-20 w-full'} role="main" tabIndex={-1}>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={
                            <motion.div {...pageTransition}>
                                <HeroSection />
                                <FeaturedProducts />
                                <ContactSection />
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
                        <Route path="/blog" element={
                            <motion.div {...pageTransition}><Blog /></motion.div>
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
            <WishlistProvider>
                <CartProvider>
                    <AppContent />
                </CartProvider>
            </WishlistProvider>
        </ThemeProvider>
    );
}

export default App;