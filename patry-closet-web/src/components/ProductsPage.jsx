import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Filter, ChevronDown, Search as SearchIcon } from 'lucide-react';
import Carousel from 'infinite-react-carousel';
import { Link } from 'react-router-dom';
import Slider from 'react-slider'; // Nueva dependencia para slider de precio
import { useTranslation } from 'react-i18next'; // Agregado para i18n

// Mock data extendido (agregado popularity para sorting)
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

// Mock recomendaciones (simuladas)
const mockRecommendations = mockProducts.slice(0, 8); // Puedes filtrar basado en preferencias

const ProductsPage = () => {
    const { t } = useTranslation(); // Agregado para traducciones
    const [filters, setFilters] = useState({
        category: '',
        price: [0, 200], // Rango inicial corregido
        color: '',
        size: '',
        search: '', // Nuevo: búsqueda por nombre
    });
    const [sort, setSort] = useState('popularity-desc'); // Nuevo: sorting
    const [filteredProducts, setFilteredProducts] = useState(mockProducts);
    const [visibleProducts, setVisibleProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const productsPerPage = 8; // Para infinite scroll
    const observerRef = useRef(null);

    // Categorías, colores, tallas únicas desde mock (avanzado: extraídas dinámicamente)
    const categories = [...new Set(mockProducts.map(p => p.category))];
    const colors = [...new Set(mockProducts.map(p => p.color))];
    const sizes = [...new Set(mockProducts.map(p => p.size).filter(s => s !== '-'))];

    // Filtrado y sorting (corregido y avanzado)
    useEffect(() => {
        let products = mockProducts;

        // Búsqueda
        if (filters.search) {
            products = products.filter(p => p.name.toLowerCase().includes(filters.search.toLowerCase()));
        }

        // Categoría
        if (filters.category) {
            products = products.filter(p => p.category === filters.category);
        }

        // Precio (corregido: inclusivo)
        products = products.filter(p => p.price >= filters.price[0] && p.price <= filters.price[1]);

        // Color
        if (filters.color) {
            products = products.filter(p => p.color === filters.color);
        }

        // Talla (corregido: ignora '-' para accesorios)
        if (filters.size) {
            products = products.filter(p => p.size === filters.size || p.size === '-');
        }

        // Sorting
        switch (sort) {
            case 'price-asc':
                products.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                products.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                products.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'popularity-desc':
                products.sort((a, b) => b.popularity - a.popularity);
                break;
            default:
                break;
        }

        setFilteredProducts(products);
        setVisibleProducts(products.slice(0, productsPerPage));
        setPage(1);
    }, [filters, sort]);

    // Infinite scroll (avanzado: usando IntersectionObserver)
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && visibleProducts.length < filteredProducts.length) {
                    setIsLoading(true);
                    setTimeout(() => { // Simula carga
                        const nextPage = page + 1;
                        const newProducts = filteredProducts.slice(0, nextPage * productsPerPage);
                        setVisibleProducts(newProducts);
                        setPage(nextPage);
                        setIsLoading(false);
                    }, 500);
                }
            },
            { threshold: 0.1 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [page, filteredProducts, visibleProducts.length]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({ category: '', price: [0, 200], color: '', size: '', search: '' });
        setSort('popularity-desc');
    };

    // Preparado para API con react-query (descomenta cuando API lista)
    // const { data: productsFromApi, isLoading: apiLoading } = useQuery(['products'], () => axios.get('/api/products').then(res => res.data));
    // useEffect(() => { if (productsFromApi) setFilteredProducts(productsFromApi); }, [productsFromApi]);

    return (
        <section className="py-16 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
                {/* Filtros Aside (sticky en desktop) */}
                <motion.aside
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full lg:w-64 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg lg:sticky lg:top-20"
                >
                    <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-800 dark:text-gray-200"><Filter className="mr-2" /> {t('filters')}</h3>

                    {/* Búsqueda (nuevo) */}
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">{t('search')}:</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={filters.search}
                                onChange={e => handleFilterChange('search', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-600 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                placeholder={t('productNamePlaceholder')}
                                aria-label={t('searchProducts')}
                            />
                            <SearchIcon className="absolute right-3 top-3 text-gray-400" size={18} />
                        </div>
                    </div>

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

                    <button onClick={resetFilters} className="w-full bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition" aria-label={t('resetFilters')}>
                        {t('resetFilters')}
                    </button>
                </motion.aside>

                {/* Grid Principal */}
                <div className="flex-1">
                    <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200">{t('productCatalog')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {visibleProducts.map(product => (
                            <Link to={`/products/${product.id}`} key={product.id}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 hover:shadow-2xl transition duration-300 ease-in-out"
                                >
                                    <img src={product.image} alt={product.name} className="w-full h-80 object-cover" loading="lazy" />
                                    <div className="p-6">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{product.name}</h3>
                                        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">${product.price.toFixed(2)}</p>
                                        <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200" aria-label={`${t('viewDetails')} ${product.name}`}>
                                            {t('viewDetails')}
                                        </button>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                    {isLoading && <p className="text-center mt-8 text-gray-600 dark:text-gray-400">{t('loadingMoreProducts')}</p>}
                    <div ref={observerRef} className="h-10" /> {/* Trigger para observer */}

                    {/* Recomendaciones */}
                    <section className="mt-16">
                        <h3 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200">{t('personalizedRecommendations')}</h3>
                        <Carousel slidesToShow={4} arrows arrowsScroll={4} responsive={[{ breakpoint: 1024, settings: { slidesToShow: 3 } }, { breakpoint: 600, settings: { slidesToShow: 2 } }]}>
                            {mockRecommendations.map(rec => (
                                <div key={rec.id} className="p-4">
                                    <Link to={`/products/${rec.id}`}>
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                                            <img src={rec.image} alt={rec.name} className="w-full h-48 object-cover" />
                                            <div className="p-4">
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{rec.name}</h4>
                                                <p className="text-gray-700 dark:text-gray-300">${rec.price.toFixed(2)}</p>
                                                <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-600" aria-label={`${t('viewMore')} ${rec.name}`}>
                                                    {t('viewMore')}
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </Carousel>
                        <p className="text-center text-gray-500 dark:text-gray-400 mt-4">{t('basedOnPreferences')}</p>
                    </section>
                </div>
            </div>
        </section>
    );
};

export default ProductsPage;