import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturedProducts from './components/FeaturedProducts';
import ProductsPage from './components/ProductsPage';
import ProductDetail from './components/ProductDetail';
import ContactSection from './components/ContactSection';
import Cart from './components/Cart';
import Blog from './components/Blog';
/*import WishlistPage from './components/WishlistPage'; // ← nuevo*/

import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

function App() {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') setDarkMode(true);
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(!darkMode);

    return (
        <WishlistProvider>
            <CartProvider>
                <div className={`w-full min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
                    <Navbar toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
                    <main className="pt-20 w-full"> {/* ← cambiado a pt-20 porque navbar es h-20 */}
                        <Routes>
                            <Route path="/" element={
                                <>
                                    <HeroSection />
                                    <FeaturedProducts onQuickView={() => { }} /> {/* ← prop obligatoria */}
                                    <ContactSection />
                                </>
                            } />
                            <Route path="/products" element={<ProductsPage />} />
                            <Route path="/products/:id" element={<ProductDetail />} />
                            <Route path="/cart" element={<Cart />} />
                            {/*<Route path="/wishlist" element={<WishlistPage />} />*/}
                            <Route path="/blog" element={<Blog />} />
                        </Routes>
                    </main>
                </div>
            </CartProvider>
        </WishlistProvider>
    );
}

export default App;