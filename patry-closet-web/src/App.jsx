import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturedProducts from './components/FeaturedProducts';

// Placeholder para otras páginas
const ProductsPage = () => <div className="py-20 text-center">Página de Productos (Grid completo en desarrollo)</div>;
const CartPage = () => <div className="py-20 text-center">Página de Carrito (En desarrollo)</div>;

function App() {
    return (
        <div className="w-full"> {/* Asegura full-width en root */}
            <Navbar />
            <main className="pt-16"> {/* Padding para evitar overlap con navbar fixed */}
                <Routes>
                    <Route path="/" element={
                        <>
                            <HeroSection />
                            <FeaturedProducts />
                        </>
                    } />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/cart" element={<CartPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;