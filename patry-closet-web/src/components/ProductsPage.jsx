import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Filter, Search, ChevronDown } from 'lucide-react';
import InfiniteScroll from 'infinite-react-carousel'; // Para carrusel de recomendaciones

const fetchProducts = async ({ queryKey }) => {
    const [_, filters] = queryKey;
    const res = await axios.get('http://localhost:5000/api/products', { params: filters }); // Ajusta puerto de tu .NET API
    return res.data;
};

const ProductsPage = () => {
    const [filters, setFilters] = useState({ category: '', priceMin: 0, priceMax: 1000, color: '', size: '', search: '' });
    const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery(
        ['products', filters],
        fetchProducts,
        { getNextPageParam: (lastPage) => lastPage.nextPage }
    );

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const products = data?.pages.flatMap((page) => page.products) || [];

    // Innovación: Recomendaciones AI-simuladas (basadas en localStorage views o API call a /api/recommendations)
    const recommendations = []; // Fetch from API or simulate

    return (
        <section className="py-12 bg-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filtros Innovadores (collapsible en mobile) */}
                <motion.aside
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full lg:w-64 bg-white p-6 rounded-xl shadow-lg"
                >
                    <h3 className="text-2xl font-bold mb-6 flex items-center"><Filter className="mr-2" /> Filtros</h3>
                    {/* Búsqueda Semántica */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Busca: 'vestidos rojos para verano'"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full p-3 border rounded-full focus:border-blue-600 outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Powered by AI para resultados inteligentes</p>
                    </div>
                    {/* Filtros Categoría con Dropdown */}
                    <div className="mb-4">
                        <button className="flex items-center w-full text-left font-medium"><ChevronDown className="mr-2" /> Categoría</button>
                        {/* Checkboxes para sub-cats */}
                        {['Mujeres', 'Hombres', 'Accesorios'].map(cat => (
                            <label key={cat} className="block mt-2">
                                <input type="checkbox" onChange={(e) => handleFilterChange('category', e.target.checked ? cat : '')} /> {cat}
                            </label>
                        ))}
                    </div>
                    {/* Slider Precio (usar range input para innovación) */}
                    <div className="mb-4">
                        <label>Precio: ${filters.priceMin} - ${filters.priceMax}</label>
                        <input type="range" min="0" max="1000" value={filters.priceMax} onChange={(e) => handleFilterChange('priceMax', e.target.value)} className="w-full" />
                    </div>
                    {/* Colores (swatches circulares) */}
                    <div className="mb-4">
                        <label>Colores:</label>
                        <div className="flex space-x-2 mt-2">
                            {['Rojo', 'Azul', 'Negro'].map(color => (
                                <div key={color} className={`w-6 h-6 rounded-full cursor-pointer ${color.toLowerCase() === 'rojo' ? 'bg-red-500' : color.toLowerCase() === 'azul' ? 'bg-blue-500' : 'bg-black'}`} onClick={() => handleFilterChange('color', color)} />
                            ))}
                        </div>
                    </div>
                    {/* Tallas (chips) */}
                    <div>
                        <label>Tallas:</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                                <span key={size} className="px-3 py-1 bg-gray-200 rounded-full cursor-pointer hover:bg-blue-200" onClick={() => handleFilterChange('size', size)}>{size}</span>
                            ))}
                        </div>
                    </div>
                </motion.aside>

                {/* Grid Principal con Infinite Scroll */}
                <div className="flex-1">
                    <h2 className="text-4xl font-bold text-center mb-8">Catálogo de Productos</h2>
                    {isLoading ? <p>Cargando...</p> : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {products.map(product => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition duration-300"
                                >
                                    <img src={product.image} alt={product.name} className="w-full h-80 object-cover" loading="lazy" />
                                    <div className="p-6">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                                        <p className="text-lg text-gray-700 mb-4">${product.price.toFixed(2)}</p>
                                        <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700">Añadir al Carrito</button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                    {hasNextPage && <button onClick={fetchNextPage} className="mt-8 mx-auto block bg-gray-200 px-6 py-3 rounded-full">Cargar Más</button>}

                    {/* Sección Recomendaciones Innovadora (Carrusel AI) */}
                    <section className="mt-16">
                        <h3 className="text-3xl font-bold text-center mb-8">Recomendaciones Personalizadas (Powered by AI)</h3>
                        <InfiniteScroll slidesToShow={4} arrows={true}>
                            {recommendations.map(rec => (
                                <div key={rec.id} className="p-4">
                                    {/* Card similar a featured */}
                                </div>
                            ))}
                        </InfiniteScroll>
                    </section>
                </div>
            </div>
        </section>
    );
};

export default ProductsPage;