import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, ChevronDown } from 'lucide-react';
import Carousel from 'infinite-react-carousel'; // Para carrusel de recomendaciones (renombrado para evitar conflictos)

// Mock data para productos (reemplaza con API cuando server esté desarrollado)
const mockProducts = [
    { id: 1, name: 'Vestido Elegante', price: 59.99, image: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', category: 'Mujeres', color: 'Rojo', size: 'M' },
    { id: 2, name: 'Camisa Moderna', price: 39.99, image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', category: 'Hombres', color: 'Azul', size: 'L' },
    { id: 3, name: 'Pantalón Trendy', price: 49.99, image: 'https://images.unsplash.com/photo-1594633312681-86309903deb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', category: 'Mujeres', color: 'Negro', size: 'S' },
    { id: 4, name: 'Accesorio Chic', price: 19.99, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', category: 'Accesorios', color: 'Rojo', size: 'XS' },
    // Agrega más mocks para testing infinite scroll (duplica si necesitas)
    { id: 5, name: 'Vestido Verano', price: 69.99, image: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', category: 'Mujeres', color: 'Azul', size: 'M' },
    // ... hasta 20+ para simular paginación
];

// Mock para recomendaciones AI (simuladas basadas en categorías)
const mockRecommendations = [
    { id: 101, name: 'Recomendado 1', price: 29.99, image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
    { id: 102, name: 'Recomendado 2', price: 45.99, image: 'https://images.unsplash.com/photo-1594633312681-86309903deb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
    // Agrega 8+ para carrusel
];

const ProductsPage = () => {
    const [filters, setFilters] = useState({ category: '', priceMin: 0, priceMax: 1000, color: '', size: '', search: '' });
    const [visibleProducts, setVisibleProducts] = useState(mockProducts.slice(0, 8)); // Simula infinite scroll con slices
    const [page, setPage] = useState(1);
    const hasNextPage = page * 8 < mockProducts.length;

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        // Filtra mocks (en real, re-fetch API)
        const filtered = mockProducts.filter(p =>
            (!filters.category || p.category === filters.category) &&
            (p.price >= filters.priceMin && p.price <= filters.priceMax) &&
            (!filters.color || p.color === filters.color) &&
            (!filters.size || p.size === filters.size) &&
            (!filters.search || p.name.toLowerCase().includes(filters.search.toLowerCase()))
        );
        setVisibleProducts(filtered.slice(0, 8));
        setPage(1);
    };

    const loadMore = () => {
        setVisibleProducts(prev => [...prev, ...mockProducts.slice(page * 8, (page + 1) * 8)]);
        setPage(prev => prev + 1);
    };

    return (
        <section className="py-12 bg-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filtros Innovadores (collapsible en mobile) */}
                <motion.aside
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full lg:w-64 bg-white p-6 rounded-xl shadow-lg"
                >
                    <h3 className="text-2xl font-bold mb-6 flex items-center"><Filter className="mr-2 h-5 w-5" /> Filtros</h3>
                    {/* Búsqueda Semántica */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Busca: 'vestidos rojos para verano'"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-full focus:border-blue-600 focus:outline-none transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-2">Búsqueda inteligente para resultados precisos</p>
                    </div>
                    {/* Filtros Categoría con Dropdown */}
                    <div className="mb-6">
                        <button className="flex items-center w-full text-left font-medium text-gray-700 hover:text-blue-600 transition-colors">
                            <ChevronDown className="mr-2 h-4 w-4" /> Categoría
                        </button>
                        <div className="mt-2 space-y-2">
                            {['Mujeres', 'Hombres', 'Accesorios', 'Ofertas'].map(cat => (
                                <label key={cat} className="block text-gray-600">
                                    <input
                                        type="checkbox"
                                        className="mr-2 accent-blue-600"
                                        onChange={(e) => handleFilterChange('category', e.target.checked ? cat : '')}
                                    />
                                    {cat}
                                </label>
                            ))}
                        </div>
                    </div>
                    {/* Slider Precio */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">Precio: ${filters.priceMin} - ${filters.priceMax}</label>
                        <input
                            type="range"
                            min="0"
                            max="1000"
                            value={filters.priceMax}
                            onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                            className="w-full accent-blue-600"
                        />
                    </div>
                    {/* Colores (swatches circulares innovadores) */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">Colores:</label>
                        <div className="flex space-x-3">
                            {['Rojo', 'Azul', 'Negro', 'Blanco'].map(color => (
                                <div
                                    key={color}
                                    className={`w-8 h-8 rounded-full cursor-pointer border-2 ${filters.color === color ? 'border-blue-600' : 'border-gray-300'} transition-all`}
                                    style={{ backgroundColor: color.toLowerCase() }}
                                    onClick={() => handleFilterChange('color', color)}
                                />
                            ))}
                        </div>
                    </div>
                    {/* Tallas (chips interactivos) */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Tallas:</label>
                        <div className="flex flex-wrap gap-2">
                            {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                                <span
                                    key={size}
                                    className={`px-4 py-1 rounded-full cursor-pointer transition-colors ${filters.size === size ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`}
                                    onClick={() => handleFilterChange('size', size)}
                                >
                                    {size}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.aside>

                {/* Grid Principal con Infinite Scroll Simulado */}
                <div className="flex-1">
                    <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Catálogo de Productos</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {visibleProducts.map(product => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 hover:shadow-2xl transition duration-300 ease-in-out"
                            >
                                <img src={product.image} alt={product.name} className="w-full h-80 object-cover" loading="lazy" />
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                                    <p className="text-lg text-gray-700 mb-4">${product.price.toFixed(2)}</p>
                                    <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200">Añadir al Carrito</button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {hasNextPage && (
                        <button
                            onClick={loadMore}
                            className="mt-12 mx-auto block bg-gray-200 text-gray-800 px-8 py-4 rounded-full font-medium hover:bg-gray-300 transition duration-200"
                        >
                            Cargar Más Productos
                        </button>
                    )}

                    {/* Sección Recomendaciones Innovadora (Carrusel con Simulación AI) */}
                    <section className="mt-16">
                        <h3 className="text-3xl font-bold text-center mb-12 text-gray-800">Recomendaciones Personalizadas</h3>
                        <Carousel slidesToShow={4} arrows arrowsScroll={4} responsive={[{ breakpoint: 1024, settings: { slidesToShow: 3 } }, { breakpoint: 600, settings: { slidesToShow: 2 } }]}>
                            {mockRecommendations.map(rec => (
                                <div key={rec.id} className="p-4">
                                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                        <img src={rec.image} alt={rec.name} className="w-full h-48 object-cover" />
                                        <div className="p-4">
                                            <h4 className="text-lg font-semibold">{rec.name}</h4>
                                            <p className="text-gray-700">${rec.price.toFixed(2)}</p>
                                            <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-600">Ver Más</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Carousel>
                        <p className="text-center text-gray-500 mt-4">Basado en tus preferencias (simulado con IA para estilos únicos)</p>
                    </section>
                </div>
            </div>
        </section>
    );
};

export default ProductsPage;