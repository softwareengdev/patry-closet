import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturedProducts from './components/FeaturedProducts';
import ProductsPage from './components/ProductsPage';

// Placeholder para otras páginas
/*const ProductsPage = () => <div className="py-20 text-center">Página de Productos (Grid completo en desarrollo)</div>;
const CartPage = () => <div className="py-20 text-center">Página de Carrito (En desarrollo)</div>;*/

function App() {
    return (
        <div className="w-full min-h-screen"> {/* Full-width root */}
            <Navbar />
            <main className="pt-16 w-full"> {/* Padding y full-width */}
                <Routes>
                    <Route path="/" element={
                        <>
                            <HeroSection />
                            <FeaturedProducts />
                        </>
                    } />
                    <Route path="/products" element={<ProductsPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;