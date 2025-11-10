import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturedProducts from './components/FeaturedProducts';
import ProductsPage from './components/ProductsPage';
import ProductDetail from './components/ProductDetail';
import ContactSection from './components/ContactSection';
import Cart from './components/Cart'; // Agregado
import { CartProvider } from './context/CartContext'; // Agregado

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
        <CartProvider> {/* Envuelve la app con el provider */}
            <div className={`w-full min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
                <Navbar toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
                <main className="pt-16 w-full">
                    <Routes>
                        <Route path="/" element={
                            <>
                                <HeroSection />
                                <FeaturedProducts />
                                <ContactSection />
                            </>
                        } />
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/products/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} /> {/* Nueva ruta */}
                    </Routes>
                </main>
            </div>
        </CartProvider>
    );
}

export default App;