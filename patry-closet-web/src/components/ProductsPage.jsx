import Slider from 'react-slider'; // Nueva dependencia para slider de precio
import { useTranslation } from 'react-i18next'; // Agregado para i18n
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Grid3X3, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { mockProducts } from './ProductsPage'; // self import
import QuickViewModal from './QuickViewModal'; // nuevo


const ProductsPage = () => {
    const { t } = useTranslation();

    const [filters, setFilters] = useState({
        category: '', price: [0, 200], color: '', size: '', search: ''
    });
    const [sort, setSort] = useState('popularity-desc');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'bento'
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

    // Debounce search
    const debouncedSearch = useCallback((value) => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: value }));
        }, 350);
    }, []);

    // Filtrado + sorting
    useEffect(() => {
        let products = [...mockProducts];

        if (filters.search) {
            products = products.filter(p => p.name.toLowerCase().includes(filters.search.toLowerCase()));
        }
        if (filters.category) products = products.filter(p => p.category === filters.category);
        if (filters.color) products = products.filter(p => p.color === filters.color);
        if (filters.size) products = products.filter(p => p.size === filters.size || p.size === '-');

        products = products.filter(p => p.price >= filters.price[0] && p.price <= filters.price[1]);

        // Sorting
        switch (sort) {
            case 'price-asc': products.sort((a, b) => a.price - b.price); break;
            case 'price-desc': products.sort((a, b) => b.price - a.price); break;
            case 'name-asc': products.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'popularity-desc': products.sort((a, b) => b.popularity - a.popularity); break;
            default: break;
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
                    {/* Sidebar filtros (sticky) */}
                    <motion.aside className="lg:w-72 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl lg:sticky lg:top-24 h-fit">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-3xl font-bold flex items-center gap-3"><Filter /> {t('filters')}</h3>
                            <button onClick={resetAllFilters} className="text-sm text-blue-600 hover:underline">Limpiar todo</button>
                        </div>

                        {/* Search con debounce */}
                        <div className="mb-8">
                            <input
                                type="text"
                                placeholder={t('productNamePlaceholder')}
                                onChange={(e) => debouncedSearch(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>

                        {/* Categorías, precio (slider), colores, tallas... (mismo que antes pero más bonito) */}
                        {/* Categorías */}
                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">{t('categories')}:</label>
                            <select
                                value={filters.category}
                                onChange={e => handleFilterChange('category', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                aria-label={t('selectCategory')}
                            >
                                <option value="">{t('all')}</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        {/* Precio (corregido con slider) */}
                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">{t('price')}: ${filters.price[0]} - ${filters.price[1]}</label>
                            <Slider
                                className="w-full h-6"
                                thumbClassName="w-6 h-6 bg-blue-600 rounded-full cursor-pointer"
                                trackClassName="h-2 bg-gray-200 dark:bg-gray-600 rounded"
                                min={0}
                                max={200}
                                value={filters.price}
                                onChange={value => handleFilterChange('price', value)}
                                pearling
                                minDistance={10}
                                ariaLabelledBy="price-label" // Para accesibilidad, aunque Slider maneja internamente
                            />
                        </div>

                        {/* Colores (corregido) */}
                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">{t('colors')}:</label>
                            <div className="flex flex-wrap gap-2">
                                {colors.map(color => (
                                    <div
                                        key={color}
                                        className={`w-8 h-8 rounded-full cursor-pointer border-2 ${filters.color === color ? 'border-blue-600' : 'border-transparent'} hover:border-blue-400 transition-all`}
                                        style={{ backgroundColor: color.toLowerCase() }}
                                        onClick={() => handleFilterChange('color', color)}
                                        aria-label={`${t('filterByColor')} ${color}`}
                                        role="button"
                                        tabIndex={0}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Tallas (corregido) */}
                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">{t('sizes')}:</label>
                            <div className="flex flex-wrap gap-2">
                                {sizes.map(size => (
                                    <span
                                        key={size}
                                        className={`px-4 py-1 rounded-full cursor-pointer transition-colors ${filters.size === size ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900'}`}
                                        onClick={() => handleFilterChange('size', size)}
                                        aria-label={`${t('filterBySize')} ${size}`}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        {size}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Sorting (nuevo) */}
                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">{t('sortBy')}:</label>
                            <select
                                value={sort}
                                onChange={e => setSort(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                aria-label={t('selectSort')}
                            >
                                <option value="popularity-desc">{t('popularityDesc')}</option>
                                <option value="price-asc">{t('priceAsc')}</option>
                                <option value="price-desc">{t('priceDesc')}</option>
                                <option value="name-asc">{t('nameAsc')}</option>
                            </select>
                        </div>

                        {/* Toggle Bento / Grid */}
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
                        {/* Chips de filtros activos */}
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

                        {/* Grid / Bento */}
                        <div className={viewMode === 'grid'
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 auto-rows-fr"
                        }>
                            <AnimatePresence>
                                {visibleProducts.map(product => (
                                    <motion.div
                                        key={product.id}
                                        layout
                                        className={viewMode === 'bento' && product.id % 5 === 0 ? "lg:col-span-5 lg:row-span-2" : viewMode === 'bento' && product.id % 7 === 0 ? "lg:col-span-7" : ""}
                                    >
                                        <ProductCard product={product} onQuickView={setQuickViewProduct} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {isLoading && <div className="text-center py-12">Cargando más productos...</div>}
                        <div ref={observerRef} className="h-20" />
                    </div>
                </div>
            </div>

            {/* Quick View Modal */}
            <QuickViewModal
                product={quickViewProduct}
                isOpen={!!quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
            />
        </section>
    );
};

export default ProductsPage;