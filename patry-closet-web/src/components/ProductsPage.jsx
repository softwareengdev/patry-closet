import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Grid3X3, LayoutGrid } from 'lucide-react';
import Slider from 'react-slider';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from './ProductCard';
import QuickViewModal from './QuickViewModal';

const COLOR_MAP = {
    Rojo: '#DC2626',
    Azul: '#2563EB',
    Negro: '#1A1A1A',
    Gris: '#6B7280',
    Rosa: '#EC4899',
    Verde: '#059669',
    Beige: '#D2B48C',
    Blanco: '#F5F5F5',
    Marrón: '#8B4513',
    Plateado: '#C0C0C0',
    Crema: '#FFFDD0',
    Burdeos: '#800020',
    Camel: '#C19A6B',
    Lavanda: '#E6E6FA',
    Oliva: '#808000',
};

export const mockProducts = [
    {
        id: 1, name: 'Vestido Elegante', price: 59.99, originalPrice: 89.99, discount: 33,
        image: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
        category: 'Mujeres', colors: ['Rojo', 'Negro', 'Burdeos'], sizes: ['XS', 'S', 'M', 'L'],
        badge: 'bestSeller', rating: 4.8, reviewCount: 234, popularity: 85,
        color: 'Rojo', size: 'M',
    },
    {
        id: 2, name: 'Camisa Moderna', price: 39.99, originalPrice: null, discount: 0,
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1598033129183-c4f50c736c10?auto=format&fit=crop&w=600&q=80',
        category: 'Hombres', colors: ['Azul', 'Blanco', 'Gris'], sizes: ['S', 'M', 'L', 'XL'],
        badge: 'new', rating: 4.5, reviewCount: 89, popularity: 70,
        color: 'Azul', size: 'L',
    },
    {
        id: 3, name: 'Pantalón Trendy', price: 49.99, originalPrice: 69.99, discount: 29,
        image: 'https://images.unsplash.com/photo-1594633312681-86309903deb9?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
        category: 'Mujeres', colors: ['Negro', 'Beige', 'Oliva'], sizes: ['XS', 'S', 'M', 'L'],
        badge: null, rating: 4.6, reviewCount: 156, popularity: 90,
        color: 'Negro', size: 'S',
    },
    {
        id: 4, name: 'Accesorio Chic', price: 19.99, originalPrice: null, discount: 0,
        image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=600&q=80',
        category: 'Accesorios', colors: ['Rojo', 'Negro'], sizes: [],
        badge: 'new', rating: 4.2, reviewCount: 45, popularity: 60,
        color: 'Rojo', size: '-',
    },
    {
        id: 5, name: 'Vestido Verano', price: 69.99, originalPrice: 99.99, discount: 30,
        image: 'https://images.unsplash.com/photo-1520974735194-8d95cdf6d2ef?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80',
        category: 'Mujeres', colors: ['Azul', 'Rosa', 'Crema'], sizes: ['S', 'M', 'L'],
        badge: 'bestSeller', rating: 4.9, reviewCount: 312, popularity: 95,
        color: 'Azul', size: 'M',
    },
    {
        id: 6, name: 'Chaqueta Casual', price: 89.99, originalPrice: null, discount: 0,
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80',
        category: 'Hombres', colors: ['Gris', 'Negro', 'Camel'], sizes: ['M', 'L', 'XL'],
        badge: null, rating: 4.4, reviewCount: 98, popularity: 80,
        color: 'Gris', size: 'L',
    },
    {
        id: 7, name: 'Blusa Floral', price: 34.99, originalPrice: 49.99, discount: 30,
        image: 'https://images.unsplash.com/photo-1520975918318-3e9c9dbead13?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=600&q=80',
        category: 'Mujeres', colors: ['Rosa', 'Lavanda', 'Crema'], sizes: ['XS', 'S', 'M'],
        badge: 'new', rating: 4.3, reviewCount: 67, popularity: 75,
        color: 'Rosa', size: 'S',
    },
    {
        id: 8, name: 'Pantalón Clásico', price: 54.99, originalPrice: null, discount: 0,
        image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
        category: 'Hombres', colors: ['Negro', 'Gris', 'Beige'], sizes: ['S', 'M', 'L', 'XL'],
        badge: null, rating: 4.1, reviewCount: 54, popularity: 65,
        color: 'Negro', size: 'M',
    },
    {
        id: 9, name: 'Bolso de Cuero', price: 79.99, originalPrice: 119.99, discount: 33,
        image: 'https://images.unsplash.com/photo-1590080875833-48a57b66b84d?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
        category: 'Accesorios', colors: ['Marrón', 'Negro', 'Camel'], sizes: [],
        badge: 'bestSeller', rating: 4.7, reviewCount: 201, popularity: 88,
        color: 'Marrón', size: '-',
    },
    {
        id: 10, name: 'Zapatos Deportivos', price: 99.99, originalPrice: null, discount: 0,
        image: 'https://images.unsplash.com/photo-1600181953597-6a1cf22bb056?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
        category: 'Hombres', colors: ['Blanco', 'Negro', 'Gris'], sizes: ['40', '41', '42', '43', '44'],
        badge: 'new', rating: 4.6, reviewCount: 178, popularity: 92,
        color: 'Blanco', size: '42',
    },
    {
        id: 11, name: 'Falda Plisada', price: 44.99, originalPrice: 59.99, discount: 25,
        image: 'https://images.unsplash.com/photo-1520975918318-3e9c9dbead13?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=600&q=80',
        category: 'Mujeres', colors: ['Verde', 'Negro', 'Beige'], sizes: ['XS', 'S', 'M', 'L'],
        badge: null, rating: 4.3, reviewCount: 89, popularity: 78,
        color: 'Verde', size: 'S',
    },
    {
        id: 12, name: 'Cinturón de Piel', price: 25.99, originalPrice: null, discount: 0,
        image: 'https://images.unsplash.com/photo-1514995669114-6081e934b693?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
        category: 'Accesorios', colors: ['Negro', 'Marrón'], sizes: [],
        badge: null, rating: 4.0, reviewCount: 32, popularity: 55,
        color: 'Negro', size: '-',
    },
    {
        id: 13, name: 'Abrigo Largo', price: 129.99, originalPrice: 179.99, discount: 28,
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3f76?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80',
        category: 'Mujeres', colors: ['Beige', 'Negro', 'Camel'], sizes: ['S', 'M', 'L', 'XL'],
        badge: 'bestSeller', rating: 4.8, reviewCount: 267, popularity: 82,
        color: 'Beige', size: 'L',
    },
    {
        id: 14, name: 'Polo Deportivo', price: 29.99, originalPrice: null, discount: 0,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
        category: 'Hombres', colors: ['Verde', 'Azul', 'Blanco'], sizes: ['S', 'M', 'L', 'XL'],
        badge: null, rating: 4.2, reviewCount: 76, popularity: 68,
        color: 'Verde', size: 'M',
    },
    {
        id: 15, name: 'Sombrero Veraniego', price: 22.99, originalPrice: 34.99, discount: 34,
        image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=600&q=80',
        category: 'Accesorios', colors: ['Beige', 'Blanco', 'Negro'], sizes: [],
        badge: null, rating: 4.1, reviewCount: 41, popularity: 62,
        color: 'Beige', size: '-',
    },
    {
        id: 16, name: 'Blazer Formal', price: 109.99, originalPrice: null, discount: 0,
        image: 'https://images.unsplash.com/photo-1593032465171-8b0f6b8a4ef1?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
        category: 'Hombres', colors: ['Gris', 'Negro', 'Azul'], sizes: ['M', 'L', 'XL'],
        badge: 'new', rating: 4.7, reviewCount: 145, popularity: 87,
        color: 'Gris', size: 'M',
    },
    {
        id: 17, name: 'Top Deportivo', price: 27.99, originalPrice: null, discount: 0,
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
        category: 'Mujeres', colors: ['Negro', 'Rosa', 'Blanco'], sizes: ['XS', 'S', 'M'],
        badge: null, rating: 4.0, reviewCount: 58, popularity: 72,
        color: 'Negro', size: 'S',
    },
    {
        id: 18, name: 'Leggings Fitness', price: 35.99, originalPrice: 49.99, discount: 28,
        image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07b?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=600&q=80',
        category: 'Mujeres', colors: ['Gris', 'Negro', 'Azul'], sizes: ['XS', 'S', 'M', 'L'],
        badge: null, rating: 4.4, reviewCount: 112, popularity: 76,
        color: 'Gris', size: 'M',
    },
    {
        id: 19, name: 'Reloj Clásico', price: 149.99, originalPrice: 199.99, discount: 25,
        image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80',
        category: 'Accesorios', colors: ['Plateado', 'Negro'], sizes: [],
        badge: 'bestSeller', rating: 4.9, reviewCount: 389, popularity: 91,
        color: 'Plateado', size: '-',
    },
    {
        id: 20, name: 'Sudadera Urbana', price: 59.99, originalPrice: null, discount: 0,
        image: 'https://images.unsplash.com/photo-1618354691438-25bc0f99d21d?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80',
        category: 'Hombres', colors: ['Negro', 'Gris', 'Verde'], sizes: ['S', 'M', 'L', 'XL'],
        badge: 'new', rating: 4.5, reviewCount: 134, popularity: 84,
        color: 'Negro', size: 'L',
    },
    {
        id: 21, name: 'Vestido Floral', price: 74.99, originalPrice: 109.99, discount: 32,
        image: 'https://images.unsplash.com/photo-1520974735194-8d95cdf6d2ef?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
        category: 'Mujeres', colors: ['Rosa', 'Crema', 'Lavanda'], sizes: ['XS', 'S', 'M', 'L'],
        badge: 'bestSeller', rating: 4.8, reviewCount: 278, popularity: 89,
        color: 'Rosa', size: 'M',
    },
    {
        id: 22, name: 'Gorra Casual', price: 19.99, originalPrice: null, discount: 0,
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3f76?auto=format&fit=crop&w=600&q=80',
        hoverImage: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=600&q=80',
        category: 'Accesorios', colors: ['Azul', 'Negro', 'Blanco'], sizes: [],
        badge: null, rating: 3.9, reviewCount: 28, popularity: 58,
        color: 'Azul', size: '-',
    },
];

export { COLOR_MAP };

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

                        <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 auto-rows-fr"}>
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