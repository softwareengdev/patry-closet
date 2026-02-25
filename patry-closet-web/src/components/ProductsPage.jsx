import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Grid3X3, LayoutGrid } from 'lucide-react';
import Slider from 'react-slider';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from './ProductCard';
import QuickViewModal from './QuickViewModal';

export const mockProducts = [
    { id: 1, name: 'Vestido Elegante', price: 59.99, image: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=500&q=80', category: 'Mujeres', color: 'Rojo', size: 'M', popularity: 85 },
    { id: 2, name: 'Camisa Moderna', price: 39.99, image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=500&q=80', category: 'Hombres', color: 'Azul', size: 'L', popularity: 70 },
    { id: 3, name: 'Pantalón Trendy', price: 49.99, image: 'https://images.unsplash.com/photo-1594633312681-86309903deb9?auto=format&fit=crop&w=500&q=80', category: 'Mujeres', color: 'Negro', size: 'S', popularity: 90 },
    { id: 4, name: 'Accesorio Chic', price: 19.99, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=500&q=80', category: 'Accesorios', color: 'Rojo', size: '-', popularity: 60 },
    { id: 5, name: 'Vestido Verano', price: 69.99, image: 'https://images.unsplash.com/photo-1520974735194-8d95cdf6d2ef?auto=format&fit=crop&w=500&q=80', category: 'Mujeres', color: 'Azul', size: 'M', popularity: 95 },
    { id: 6, name: 'Chaqueta Casual', price: 89.99, image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=500&q=80', category: 'Hombres', color: 'Gris', size: 'L', popularity: 80 },
    { id: 7, name: 'Blusa Floral', price: 34.99, image: 'https://images.unsplash.com/photo-1520975918318-3e9c9dbead13?auto=format&fit=crop&w=500&q=80', category: 'Mujeres', color: 'Rosa', size: 'S', popularity: 75 },
    { id: 8, name: 'Pantalón Clásico', price: 54.99, image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=500&q=80', category: 'Hombres', color: 'Negro', size: 'M', popularity: 65 },
    { id: 9, name: 'Bolso de Cuero', price: 79.99, image: 'https://images.unsplash.com/photo-1590080875833-48a57b66b84d?auto=format&fit=crop&w=500&q=80', category: 'Accesorios', color: 'Marrón', size: '-', popularity: 88 },
    { id: 10, name: 'Zapatos Deportivos', price: 99.99, image: 'https://images.unsplash.com/photo-1600181953597-6a1cf22bb056?auto=format&fit=crop&w=500&q=80', category: 'Hombres', color: 'Blanco', size: '42', popularity: 92 },
    { id: 11, name: 'Falda Plisada', price: 44.99, image: 'https://images.unsplash.com/photo-1520975918318-3e9c9dbead13?auto=format&fit=crop&w=500&q=80', category: 'Mujeres', color: 'Verde', size: 'S', popularity: 78 },
    { id: 12, name: 'Cinturón de Piel', price: 25.99, image: 'https://images.unsplash.com/photo-1514995669114-6081e934b693?auto=format&fit=crop&w=500&q=80', category: 'Accesorios', color: 'Negro', size: '-', popularity: 55 },
    { id: 13, name: 'Abrigo Largo', price: 129.99, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3f76?auto=format&fit=crop&w=500&q=80', category: 'Mujeres', color: 'Beige', size: 'L', popularity: 82 },
    { id: 14, name: 'Polo Deportivo', price: 29.99, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80', category: 'Hombres', color: 'Verde', size: 'M', popularity: 68 },
    { id: 15, name: 'Sombrero Veraniego', price: 22.99, image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=500&q=80', category: 'Accesorios', color: 'Beige', size: '-', popularity: 62 },
    { id: 16, name: 'Blazer Formal', price: 109.99, image: 'https://images.unsplash.com/photo-1593032465171-8b0f6b8a4ef1?auto=format&fit=crop&w=500&q=80', category: 'Hombres', color: 'Gris', size: 'M', popularity: 87 },
    { id: 17, name: 'Top Deportivo', price: 27.99, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=500&q=80', category: 'Mujeres', color: 'Negro', size: 'S', popularity: 72 },
    { id: 18, name: 'Leggings Fitness', price: 35.99, image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07b?auto=format&fit=crop&w=500&q=80', category: 'Mujeres', color: 'Gris', size: 'M', popularity: 76 },
    { id: 19, name: 'Reloj Clásico', price: 149.99, image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=500&q=80', category: 'Accesorios', color: 'Plateado', size: '-', popularity: 91 },
    { id: 20, name: 'Sudadera Urbana', price: 59.99, image: 'https://images.unsplash.com/photo-1618354691438-25bc0f99d21d?auto=format&fit=crop&w=500&q=80', category: 'Hombres', color: 'Negro', size: 'L', popularity: 84 },
    { id: 21, name: 'Vestido Floral', price: 74.99, image: 'https://images.unsplash.com/photo-1520974735194-8d95cdf6d2ef?auto=format&fit=crop&w=500&q=80', category: 'Mujeres', color: 'Rosa', size: 'M', popularity: 89 },
    { id: 22, name: 'Gorra Casual', price: 19.99, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3f76?auto=format&fit=crop&w=500&q=80', category: 'Accesorios', color: 'Azul', size: '-', popularity: 58 },
    // Agrega más si necesitas expandir el mock
];

const ProductsPage = () => {
    const { t } = useTranslation();

    const [filters, setFilters] = useState({
        category: '', price: [0, 200], color: '', size: '', search: ''
    });
    const [sort, setSort] = useState('popularity-desc');
    const [viewMode, setViewMode] = useState('grid');
    const [filteredProducts, setFilteredProducts] = useState(mockProducts);
    const [visibleProducts, setVisibleProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [quickViewProduct, setQuickViewProduct] = useState(null);

    const productsPerPage = 12;
    const observerRef = useRef(null);
    const debounceTimeout = useRef(null);

    const categories = [...new Set(mockProducts.map(p => p.category))];
    const colors = [...new Set(mockProducts.map(p => p.color))];
    const sizes = [...new Set(mockProducts.map(p => p.size).filter(s => s !== '-'))];

    // === FUNCIÓN FALTANTE (ESTO ROMPÍA TODO) ===
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const debouncedSearch = useCallback((value) => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: value }));
        }, 350);
    }, []);

    // Filtrado + sorting
    useEffect(() => {
        let products = [...mockProducts];

        if (filters.search) products = products.filter(p => p.name.toLowerCase().includes(filters.search.toLowerCase()));
        if (filters.category) products = products.filter(p => p.category === filters.category);
        if (filters.color) products = products.filter(p => p.color === filters.color);
        if (filters.size) products = products.filter(p => p.size === filters.size || p.size === '-');
        products = products.filter(p => p.price >= filters.price[0] && p.price <= filters.price[1]);

        switch (sort) {
            case 'price-asc': products.sort((a, b) => a.price - b.price); break;
            case 'price-desc': products.sort((a, b) => b.price - a.price); break;
            case 'name-asc': products.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'popularity-desc': products.sort((a, b) => b.popularity - a.popularity); break;
        }

        setFilteredProducts(products);
        setVisibleProducts(products.slice(0, productsPerPage));
        setPage(1);
    }, [filters, sort]);

    // Infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && visibleProducts.length < filteredProducts.length) {
                setIsLoading(true);
                setTimeout(() => {
                    const next = page + 1;
                    setVisibleProducts(filteredProducts.slice(0, next * productsPerPage));
                    setPage(next);
                    setIsLoading(false);
                }, 600);
            }
        }, { threshold: 0.1 });

        if (observerRef.current) observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [page, filteredProducts, visibleProducts.length]);

    const removeFilter = (key) => {
        if (key === 'price') setFilters(prev => ({ ...prev, price: [0, 200] }));
        else setFilters(prev => ({ ...prev, [key]: '' }));
    };

    const resetAllFilters = () => {
        setFilters({ category: '', price: [0, 200], color: '', size: '', search: '' });
        setSort('popularity-desc');
    };

    const activeFilters = [
        filters.category && { key: 'category', label: filters.category },
        filters.color && { key: 'color', label: filters.color },
        filters.size && { key: 'size', label: filters.size },
        filters.search && { key: 'search', label: filters.search }
    ].filter(Boolean);

    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Sidebar filtros */}
                    <motion.aside className="lg:w-72 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl lg:sticky lg:top-24 h-fit">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-3xl font-bold flex items-center gap-3"><Filter /> {t('filters')}</h3>
                            <button onClick={resetAllFilters} className="text-sm text-blue-600 hover:underline">Limpiar todo</button>
                        </div>

                        {/* Search debounce */}
                        <div className="mb-8">
                            <input
                                type="text"
                                placeholder={t('productNamePlaceholder')}
                                onChange={(e) => debouncedSearch(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>

                        {/* Categorías */}
                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">{t('categories')}:</label>
                            <select value={filters.category} onChange={e => handleFilterChange('category', e.target.value)} className="w-full px-4 py-3 border rounded-2xl dark:bg-gray-800">
                                <option value="">{t('all')}</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        {/* Precio slider */}
                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">{t('price')}: ${filters.price[0]} - ${filters.price[1]}</label>
                            <Slider
                                className="w-full h-6"
                                thumbClassName="w-6 h-6 bg-blue-600 rounded-full cursor-pointer"
                                trackClassName="h-2 bg-gray-200 dark:bg-gray-600 rounded"
                                min={0} max={200}
                                value={filters.price}
                                onChange={value => handleFilterChange('price', value)}
                                pearling minDistance={10}
                            />
                        </div>

                        {/* Colores */}
                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">{t('colors')}:</label>
                            <div className="flex flex-wrap gap-3">
                                {colors.map(color => (
                                    <div key={color} onClick={() => handleFilterChange('color', color)}
                                        className={`w-9 h-9 rounded-full cursor-pointer border-2 ${filters.color === color ? 'border-blue-600 scale-110' : 'border-transparent hover:border-gray-400'}`}
                                        style={{ backgroundColor: color.toLowerCase() }} />
                                ))}
                            </div>
                        </div>

                        {/* Tallas */}
                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">{t('sizes')}:</label>
                            <div className="flex flex-wrap gap-2">
                                {sizes.map(size => (
                                    <span key={size} onClick={() => handleFilterChange('size', size)}
                                        className={`px-5 py-2 rounded-2xl cursor-pointer transition-all ${filters.size === size ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'}`}>
                                        {size}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Sorting */}
                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">{t('sortBy')}:</label>
                            <select value={sort} onChange={e => setSort(e.target.value)} className="w-full px-4 py-3 border rounded-2xl dark:bg-gray-800">
                                <option value="popularity-desc">{t('popularityDesc')}</option>
                                <option value="price-asc">{t('priceAsc')}</option>
                                <option value="price-desc">{t('priceDesc')}</option>
                                <option value="name-asc">{t('nameAsc')}</option>
                            </select>
                        </div>

                        {/* Toggle vista */}
                        <div className="mt-10">
                            <p className="text-sm text-gray-500 mb-3">Vista</p>
                            <div className="flex gap-3">
                                <button onClick={() => setViewMode('grid')} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                    <Grid3X3 size={20} /> Grid
                                </button>
                                <button onClick={() => setViewMode('bento')} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 ${viewMode === 'bento' ? 'bg-black text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                    <LayoutGrid size={20} /> Bento
                                </button>
                            </div>
                        </div>
                    </motion.aside>

                    {/* Main content */}
                    <div className="flex-1">
                        {activeFilters.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-8">
                                {activeFilters.map(f => (
                                    <div key={f.key} className="bg-white dark:bg-gray-900 px-5 py-2 rounded-2xl flex items-center gap-2 text-sm shadow">
                                        {f.label}
                                        <button onClick={() => removeFilter(f.key)} className="hover:text-red-500"><X size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 auto-rows-fr"}>
                            <AnimatePresence>
                                {visibleProducts.map(product => (
                                    <motion.div key={product.id} layout className={viewMode === 'bento' && product.id % 5 === 0 ? "lg:col-span-5 lg:row-span-2" : ""}>
                                        <ProductCard product={product} onQuickView={setQuickViewProduct} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {isLoading && <div className="text-center py-12 text-gray-500">Cargando más productos...</div>}
                        <div ref={observerRef} className="h-20" />
                    </div>
                </div>
            </div>

            <QuickViewModal product={quickViewProduct} isOpen={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} />
        </section>
    );
};

export default ProductsPage;