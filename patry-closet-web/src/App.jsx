import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturedProducts from './components/FeaturedProducts';
import ProductsPage from './components/ProductsPage';
import ProductDetail from './components/ProductDetail';
import ContactSection from './components/ContactSection'; // Agregado

function App() {
    return (
        <div className="w-full min-h-screen">
            <Navbar />
            <main className="pt-16 w-full">
                <Routes>
                    <Route path="/" element={
                        <>
                            <HeroSection />
                            <FeaturedProducts />
                            <ContactSection /> {/* Agregado: Nueva sección en home */}
                        </>
                    } />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;