import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Filter, X, Grid3X3, LayoutGrid, SlidersHorizontal,
    ChevronDown, ChevronUp, Check, Sparkles, Tag, Package
} from 'lucide-react';
import Slider from 'react-slider';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from './ProductCard';
import QuickViewModal from './QuickViewModal';

/* ─── Color map ─── */
const COLOR_MAP = {
    Rojo: '#DC2626', Azul: '#2563EB', Negro: '#1A1A1A', Gris: '#6B7280',
    Rosa: '#EC4899', Verde: '#059669', Beige: '#D2B48C', Blanco: '#F5F5F5',
    Marrón: '#8B4513', Plateado: '#C0C0C0', Crema: '#FFFDD0', Burdeos: '#800020',
    Camel: '#C19A6B', Lavanda: '#E6E6FA', Oliva: '#808000',
};

/* ─── Mock products with brand + availability ─── */
export const mockProducts = [
    { id: 1, name: 'Vestido Elegante', price: 59.99, originalPrice: 89.99, discount: 33, image: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80', category: 'Mujeres', colors: ['Rojo', 'Negro', 'Burdeos'], sizes: ['XS', 'S', 'M', 'L'], badge: 'bestSeller', rating: 4.8, reviewCount: 234, popularity: 85, color: 'Rojo', size: 'M', brand: 'Patry Originals', inStock: true },
    { id: 2, name: 'Camisa Moderna', price: 39.99, originalPrice: null, discount: 0, image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1598033129183-c4f50c736c10?auto=format&fit=crop&w=600&q=80', category: 'Hombres', colors: ['Azul', 'Blanco', 'Gris'], sizes: ['S', 'M', 'L', 'XL'], badge: 'new', rating: 4.5, reviewCount: 89, popularity: 70, color: 'Azul', size: 'L', brand: 'Urban Edge', inStock: true },
    { id: 3, name: 'Pantalón Trendy', price: 49.99, originalPrice: 69.99, discount: 29, image: 'https://images.unsplash.com/photo-1594633312681-86309903deb9?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80', category: 'Mujeres', colors: ['Negro', 'Beige', 'Oliva'], sizes: ['XS', 'S', 'M', 'L'], badge: null, rating: 4.6, reviewCount: 156, popularity: 90, color: 'Negro', size: 'S', brand: 'Patry Originals', inStock: true },
    { id: 4, name: 'Accesorio Chic', price: 19.99, originalPrice: null, discount: 0, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=600&q=80', category: 'Accesorios', colors: ['Rojo', 'Negro'], sizes: [], badge: 'new', rating: 4.2, reviewCount: 45, popularity: 60, color: 'Rojo', size: '-', brand: 'Luxe Atelier', inStock: true },
    { id: 5, name: 'Vestido Verano', price: 69.99, originalPrice: 99.99, discount: 30, image: 'https://images.unsplash.com/photo-1520974735194-8d95cdf6d2ef?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80', category: 'Mujeres', colors: ['Azul', 'Rosa', 'Crema'], sizes: ['S', 'M', 'L'], badge: 'bestSeller', rating: 4.9, reviewCount: 312, popularity: 95, color: 'Azul', size: 'M', brand: 'Patry Originals', inStock: true },
    { id: 6, name: 'Chaqueta Casual', price: 89.99, originalPrice: null, discount: 0, image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80', category: 'Hombres', colors: ['Gris', 'Negro', 'Camel'], sizes: ['M', 'L', 'XL'], badge: null, rating: 4.4, reviewCount: 98, popularity: 80, color: 'Gris', size: 'L', brand: 'Urban Edge', inStock: true },
    { id: 7, name: 'Blusa Floral', price: 34.99, originalPrice: 49.99, discount: 30, image: 'https://images.unsplash.com/photo-1520975918318-3e9c9dbead13?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=600&q=80', category: 'Mujeres', colors: ['Rosa', 'Lavanda', 'Crema'], sizes: ['XS', 'S', 'M'], badge: 'new', rating: 4.3, reviewCount: 67, popularity: 75, color: 'Rosa', size: 'S', brand: 'Bloom Studio', inStock: true },
    { id: 8, name: 'Pantalón Clásico', price: 54.99, originalPrice: null, discount: 0, image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80', category: 'Hombres', colors: ['Negro', 'Gris', 'Beige'], sizes: ['S', 'M', 'L', 'XL'], badge: null, rating: 4.1, reviewCount: 54, popularity: 65, color: 'Negro', size: 'M', brand: 'Urban Edge', inStock: false },
    { id: 9, name: 'Bolso de Cuero', price: 79.99, originalPrice: 119.99, discount: 33, image: 'https://images.unsplash.com/photo-1590080875833-48a57b66b84d?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80', category: 'Accesorios', colors: ['Marrón', 'Negro', 'Camel'], sizes: [], badge: 'bestSeller', rating: 4.7, reviewCount: 201, popularity: 88, color: 'Marrón', size: '-', brand: 'Luxe Atelier', inStock: true },
    { id: 10, name: 'Zapatos Deportivos', price: 99.99, originalPrice: null, discount: 0, image: 'https://images.unsplash.com/photo-1600181953597-6a1cf22bb056?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80', category: 'Hombres', colors: ['Blanco', 'Negro', 'Gris'], sizes: ['40', '41', '42', '43', '44'], badge: 'new', rating: 4.6, reviewCount: 178, popularity: 92, color: 'Blanco', size: '42', brand: 'Urban Edge', inStock: true },
    { id: 11, name: 'Falda Plisada', price: 44.99, originalPrice: 59.99, discount: 25, image: 'https://images.unsplash.com/photo-1520975918318-3e9c9dbead13?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=600&q=80', category: 'Mujeres', colors: ['Verde', 'Negro', 'Beige'], sizes: ['XS', 'S', 'M', 'L'], badge: null, rating: 4.3, reviewCount: 89, popularity: 78, color: 'Verde', size: 'S', brand: 'Bloom Studio', inStock: true },
    { id: 12, name: 'Cinturón de Piel', price: 25.99, originalPrice: null, discount: 0, image: 'https://images.unsplash.com/photo-1514995669114-6081e934b693?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', category: 'Accesorios', colors: ['Negro', 'Marrón'], sizes: [], badge: null, rating: 4.0, reviewCount: 32, popularity: 55, color: 'Negro', size: '-', brand: 'Luxe Atelier', inStock: true },
    { id: 13, name: 'Abrigo Largo', price: 129.99, originalPrice: 179.99, discount: 28, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3f76?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80', category: 'Mujeres', colors: ['Beige', 'Negro', 'Camel'], sizes: ['S', 'M', 'L', 'XL'], badge: 'bestSeller', rating: 4.8, reviewCount: 267, popularity: 82, color: 'Beige', size: 'L', brand: 'Patry Originals', inStock: true },
    { id: 14, name: 'Polo Deportivo', price: 29.99, originalPrice: null, discount: 0, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80', category: 'Hombres', colors: ['Verde', 'Azul', 'Blanco'], sizes: ['S', 'M', 'L', 'XL'], badge: null, rating: 4.2, reviewCount: 76, popularity: 68, color: 'Verde', size: 'M', brand: 'Urban Edge', inStock: false },
    { id: 15, name: 'Sombrero Veraniego', price: 22.99, originalPrice: 34.99, discount: 34, image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=600&q=80', category: 'Accesorios', colors: ['Beige', 'Blanco', 'Negro'], sizes: [], badge: null, rating: 4.1, reviewCount: 41, popularity: 62, color: 'Beige', size: '-', brand: 'Luxe Atelier', inStock: true },
    { id: 16, name: 'Blazer Formal', price: 109.99, originalPrice: null, discount: 0, image: 'https://images.unsplash.com/photo-1593032465171-8b0f6b8a4ef1?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80', category: 'Hombres', colors: ['Gris', 'Negro', 'Azul'], sizes: ['M', 'L', 'XL'], badge: 'new', rating: 4.7, reviewCount: 145, popularity: 87, color: 'Gris', size: 'M', brand: 'Urban Edge', inStock: true },
    { id: 17, name: 'Top Deportivo', price: 27.99, originalPrice: null, discount: 0, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80', category: 'Mujeres', colors: ['Negro', 'Rosa', 'Blanco'], sizes: ['XS', 'S', 'M'], badge: null, rating: 4.0, reviewCount: 58, popularity: 72, color: 'Negro', size: 'S', brand: 'Bloom Studio', inStock: true },
    { id: 18, name: 'Leggings Fitness', price: 35.99, originalPrice: 49.99, discount: 28, image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07b?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=600&q=80', category: 'Mujeres', colors: ['Gris', 'Negro', 'Azul'], sizes: ['XS', 'S', 'M', 'L'], badge: null, rating: 4.4, reviewCount: 112, popularity: 76, color: 'Gris', size: 'M', brand: 'Patry Originals', inStock: true },
    { id: 19, name: 'Reloj Clásico', price: 149.99, originalPrice: 199.99, discount: 25, image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80', category: 'Accesorios', colors: ['Plateado', 'Negro'], sizes: [], badge: 'bestSeller', rating: 4.9, reviewCount: 389, popularity: 91, color: 'Plateado', size: '-', brand: 'Luxe Atelier', inStock: true },
    { id: 20, name: 'Sudadera Urbana', price: 59.99, originalPrice: null, discount: 0, image: 'https://images.unsplash.com/photo-1618354691438-25bc0f99d21d?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80', category: 'Hombres', colors: ['Negro', 'Gris', 'Verde'], sizes: ['S', 'M', 'L', 'XL'], badge: 'new', rating: 4.5, reviewCount: 134, popularity: 84, color: 'Negro', size: 'L', brand: 'Urban Edge', inStock: true },
    { id: 21, name: 'Vestido Floral', price: 74.99, originalPrice: 109.99, discount: 32, image: 'https://images.unsplash.com/photo-1520974735194-8d95cdf6d2ef?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80', category: 'Mujeres', colors: ['Rosa', 'Crema', 'Lavanda'], sizes: ['XS', 'S', 'M', 'L'], badge: 'bestSeller', rating: 4.8, reviewCount: 278, popularity: 89, color: 'Rosa', size: 'M', brand: 'Bloom Studio', inStock: true },
    { id: 22, name: 'Gorra Casual', price: 19.99, originalPrice: null, discount: 0, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3f76?auto=format&fit=crop&w=600&q=80', hoverImage: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=600&q=80', category: 'Accesorios', colors: ['Azul', 'Negro', 'Blanco'], sizes: [], badge: null, rating: 3.9, reviewCount: 28, popularity: 58, color: 'Azul', size: '-', brand: 'Luxe Atelier', inStock: false },
];

export { COLOR_MAP };

/* ─── Derive available facet values from product data ─── */
const ALL_CATEGORIES = [...new Set(mockProducts.map(p => p.category))];
const ALL_COLORS = [...new Set(mockProducts.flatMap(p => p.colors))];
const ALL_SIZES = [...new Set(mockProducts.flatMap(p => p.sizes).filter(Boolean))];
const ALL_BRANDS = [...new Set(mockProducts.map(p => p.brand))];
const PRICE_MIN = 0;
const PRICE_MAX = 200;

/* ─── Collapsible filter section ─── */
const FilterSection = ({ title, icon: Icon, defaultOpen = true, children, count = 0 }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-warm-300 dark:border-gray-800 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-4 text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-expanded={isOpen}
            >
                <span className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4" />}
                    {title}
                    {count > 0 && <span className="bg-accent-900 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{count}</span>}
                </span>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pb-5">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─── Filter sidebar content (shared by desktop sidebar + mobile drawer) ─── */
const FilterContent = ({ filters, onFilterChange, onReset, sort, onSortChange, viewMode, onViewModeChange, resultCount, t }) => {
    const selectedColors = filters.colors || [];
    const selectedSizes = filters.sizes || [];
    const selectedBrands = filters.brands || [];

    const toggleArrayFilter = (key, value) => {
        const current = filters[key] || [];
        const next = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        onFilterChange(key, next);
    };

    return (
        <>
            {/* Result count + reset */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-warm-300 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-white">{resultCount}</span> {t('resultsFound')}
                </p>
                <button
                    onClick={onReset}
                    className="text-xs font-medium text-accent-900 dark:text-accent-200 hover:underline uppercase tracking-wider"
                    aria-label={t('resetFilters')}
                >
                    {t('clearAll')}
                </button>
            </div>

            {/* Category */}
            <FilterSection title={t('categories')} defaultOpen={true} count={filters.category ? 1 : 0}>
                <div className="space-y-1">
                    <button
                        onClick={() => onFilterChange('category', '')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!filters.category ? 'bg-accent-900 text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-warm-200 dark:hover:bg-gray-800/50'}`}
                    >
                        {t('all')}
                    </button>
                    {ALL_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => onFilterChange('category', cat)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${filters.category === cat ? 'bg-accent-900 text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-warm-200 dark:hover:bg-gray-800/50'}`}
                        >
                            <span>{cat}</span>
                            <span className="text-xs opacity-60">
                                ({mockProducts.filter(p => p.category === cat).length})
                            </span>
                        </button>
                    ))}
                </div>
            </FilterSection>

            {/* Price range */}
            <FilterSection title={t('price')} defaultOpen={true} count={filters.price[0] > PRICE_MIN || filters.price[1] < PRICE_MAX ? 1 : 0}>
                <div className="px-1">
                    <div className="flex justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">${filters.price[0]}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">${filters.price[1]}</span>
                    </div>
                    <Slider
                        className="w-full h-6 facet-price-slider"
                        thumbClassName="w-5 h-5 bg-accent-900 dark:bg-white rounded-full cursor-pointer -top-1.5 shadow-md focus-visible:ring-2 focus-visible:ring-accent-900 focus-visible:outline-none"
                        trackClassName="h-2 rounded-full"
                        min={PRICE_MIN}
                        max={PRICE_MAX}
                        value={filters.price}
                        onChange={value => onFilterChange('price', value)}
                        pearling
                        minDistance={10}
                        ariaLabel={['Minimum price', 'Maximum price']}
                    />
                </div>
            </FilterSection>

            {/* Colors — swatch-based multi-select */}
            <FilterSection title={t('colors')} defaultOpen={true} count={selectedColors.length}>
                <div className="flex flex-wrap gap-2.5">
                    {ALL_COLORS.map(colorName => {
                        const hex = COLOR_MAP[colorName] || '#ccc';
                        const isSelected = selectedColors.includes(colorName);
                        const isLight = ['Blanco', 'Crema', 'Beige', 'Lavanda'].includes(colorName);
                        return (
                            <button
                                key={colorName}
                                onClick={() => toggleArrayFilter('colors', colorName)}
                                className={`relative w-7 h-7 rounded-full transition-all duration-200 ${isSelected ? 'ring-2 ring-offset-2 ring-accent-900 dark:ring-white scale-110' : 'hover:scale-110'} ${isLight ? 'border border-warm-500' : ''}`}
                                style={{ backgroundColor: hex }}
                                title={colorName}
                                aria-label={`${t('color')}: ${colorName}`}
                                aria-pressed={isSelected}
                            >
                                {isSelected && <Check className={`absolute inset-0 m-auto w-3.5 h-3.5 ${isLight ? 'text-gray-800' : 'text-white'}`} strokeWidth={3} />}
                            </button>
                        );
                    })}
                </div>
            </FilterSection>

            {/* Sizes — pill multi-select */}
            <FilterSection title={t('sizes')} defaultOpen={true} count={selectedSizes.length}>
                <div className="flex flex-wrap gap-2">
                    {ALL_SIZES.map(size => {
                        const isSelected = selectedSizes.includes(size);
                        return (
                            <button
                                key={size}
                                onClick={() => toggleArrayFilter('sizes', size)}
                                className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-all duration-200 border ${isSelected ? 'bg-accent-900 text-white border-accent-900 dark:bg-white dark:text-black dark:border-white' : 'border-warm-400 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-warm-500 dark:hover:border-gray-500'}`}
                                aria-pressed={isSelected}
                                aria-label={`${t('size')}: ${size}`}
                            >
                                {size}
                            </button>
                        );
                    })}
                </div>
            </FilterSection>

            {/* Brand — checkbox list */}
            <FilterSection title={t('brand')} icon={Tag} defaultOpen={false} count={selectedBrands.length}>
                <div className="space-y-2">
                    {ALL_BRANDS.map(brand => {
                        const isSelected = selectedBrands.includes(brand);
                        return (
                            <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-accent-900 border-accent-900 dark:bg-white dark:border-white' : 'border-warm-500 dark:border-gray-600 group-hover:border-warm-500'}`}>
                                    {isSelected && <Check className="w-3 h-3 text-white dark:text-black" strokeWidth={3} />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleArrayFilter('brands', brand)}
                                    className="sr-only"
                                    aria-label={brand}
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{brand}</span>
                                <span className="text-xs text-gray-400 ml-auto">({mockProducts.filter(p => p.brand === brand).length})</span>
                            </label>
                        );
                    })}
                </div>
            </FilterSection>

            {/* Trend / Badge filter */}
            <FilterSection title={t('trend')} icon={Sparkles} defaultOpen={false} count={filters.badge ? 1 : 0}>
                <div className="space-y-1">
                    {[
                        { value: '', label: t('all') },
                        { value: 'new', label: t('badgeNew') },
                        { value: 'bestSeller', label: t('badgeBestSeller') },
                        { value: 'onSale', label: t('onSale') },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => onFilterChange('badge', opt.value)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filters.badge === opt.value ? 'bg-accent-900 text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-warm-200 dark:hover:bg-gray-800/50'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </FilterSection>

            {/* Availability */}
            <FilterSection title={t('availability')} icon={Package} defaultOpen={false} count={filters.inStock ? 1 : 0}>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`relative w-10 h-5 rounded-full transition-colors ${filters.inStock ? 'bg-accent-900 dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-warm-50 dark:bg-gray-900 shadow transition-transform ${filters.inStock ? 'translate-x-5' : ''}`} />
                    </div>
                    <input
                        type="checkbox"
                        checked={!!filters.inStock}
                        onChange={() => onFilterChange('inStock', !filters.inStock)}
                        className="sr-only"
                        role="switch"
                        aria-checked={!!filters.inStock}
                        aria-label={t('inStockOnly')}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('inStockOnly')}</span>
                </label>
            </FilterSection>

            {/* Sort */}
            <FilterSection title={t('sortBy')} icon={SlidersHorizontal} defaultOpen={false}>
                <div className="space-y-1">
                    {[
                        { value: 'popularity-desc', label: t('popularityDesc') },
                        { value: 'price-asc', label: t('priceAsc') },
                        { value: 'price-desc', label: t('priceDesc') },
                        { value: 'name-asc', label: t('nameAsc') },
                        { value: 'newest', label: t('newest') },
                        { value: 'rating-desc', label: t('ratingDesc') },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => onSortChange(opt.value)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${sort === opt.value ? 'bg-accent-900 text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-warm-200 dark:hover:bg-gray-800/50'}`}
                        >
                            {opt.label}
                            {sort === opt.value && <Check className="w-3.5 h-3.5" />}
                        </button>
                    ))}
                </div>
            </FilterSection>

            {/* View mode */}
            <div className="pt-5 mt-2 border-t border-warm-300 dark:border-gray-800">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">{t('viewMode')}</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => onViewModeChange('grid')}
                        className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-accent-900 text-white dark:bg-white dark:text-black' : 'bg-warm-300 dark:bg-gray-800 hover:bg-warm-400 dark:hover:bg-gray-700'}`}
                        aria-pressed={viewMode === 'grid'}
                        aria-label="Grid view"
                    >
                        <Grid3X3 size={16} /> Grid
                    </button>
                    <button
                        onClick={() => onViewModeChange('bento')}
                        className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${viewMode === 'bento' ? 'bg-accent-900 text-white dark:bg-white dark:text-black' : 'bg-warm-300 dark:bg-gray-800 hover:bg-warm-400 dark:hover:bg-gray-700'}`}
                        aria-pressed={viewMode === 'bento'}
                        aria-label="Bento view"
                    >
                        <LayoutGrid size={16} /> Bento
                    </button>
                </div>
            </div>
        </>
    );
};

/* ─── Mobile filter drawer ─── */
const MobileFilterDrawer = ({ isOpen, onClose, children }) => {
    const drawerRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            drawerRef.current?.querySelector('button')?.focus();
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    <motion.div
                        ref={drawerRef}
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-0 left-0 h-full w-[85vw] max-w-sm bg-warm-50 dark:bg-gray-950 z-[70] shadow-2xl flex flex-col"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Filters"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-warm-300 dark:border-gray-800">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Filter className="w-5 h-5" /> Filters
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-warm-300 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                aria-label="Close filters"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 overscroll-contain">
                            {children}
                        </div>
                        <div className="p-4 border-t border-warm-300 dark:border-gray-800">
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-accent-900 text-white dark:bg-white dark:text-black font-medium text-sm uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

/* ─── Main ProductsPage ─── */
const ProductsPage = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    /* Parse URL params into initial filter state */
    const parseFiltersFromURL = useCallback(() => ({
        category: searchParams.get('category') || '',
        price: [
            parseInt(searchParams.get('priceMin')) || PRICE_MIN,
            parseInt(searchParams.get('priceMax')) || PRICE_MAX,
        ],
        colors: searchParams.get('colors')?.split(',').filter(Boolean) || [],
        sizes: searchParams.get('sizes')?.split(',').filter(Boolean) || [],
        brands: searchParams.get('brands')?.split(',').filter(Boolean) || [],
        badge: searchParams.get('badge') || '',
        inStock: searchParams.get('inStock') === 'true',
        search: searchParams.get('search') || '',
    }), [searchParams]);

    const [filters, setFilters] = useState(parseFiltersFromURL);
    const [sort, setSort] = useState(searchParams.get('sort') || 'popularity-desc');
    const [viewMode, setViewMode] = useState('grid');
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const productsPerPage = 12;
    const observerRef = useRef(null);
    const isInitialMount = useRef(true);

    /* Sync URL → state when URL changes externally (e.g. navbar search) */
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        setFilters(parseFiltersFromURL());
        setSort(searchParams.get('sort') || 'popularity-desc');
    }, [searchParams, parseFiltersFromURL]);

    /* Sync state → URL params */
    const syncFiltersToURL = useCallback((newFilters, newSort) => {
        const params = new URLSearchParams();
        if (newFilters.search) params.set('search', newFilters.search);
        if (newFilters.category) params.set('category', newFilters.category);
        if (newFilters.price[0] > PRICE_MIN) params.set('priceMin', newFilters.price[0]);
        if (newFilters.price[1] < PRICE_MAX) params.set('priceMax', newFilters.price[1]);
        if (newFilters.colors.length) params.set('colors', newFilters.colors.join(','));
        if (newFilters.sizes.length) params.set('sizes', newFilters.sizes.join(','));
        if (newFilters.brands.length) params.set('brands', newFilters.brands.join(','));
        if (newFilters.badge) params.set('badge', newFilters.badge);
        if (newFilters.inStock) params.set('inStock', 'true');
        if (newSort && newSort !== 'popularity-desc') params.set('sort', newSort);
        setSearchParams(params, { replace: true });
    }, [setSearchParams]);

    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            syncFiltersToURL(next, sort);
            return next;
        });
    }, [sort, syncFiltersToURL]);

    const handleSortChange = useCallback((value) => {
        setSort(value);
        syncFiltersToURL(filters, value);
    }, [filters, syncFiltersToURL]);

    const resetAllFilters = useCallback(() => {
        const defaults = { category: '', price: [PRICE_MIN, PRICE_MAX], colors: [], sizes: [], brands: [], badge: '', inStock: false, search: '' };
        setFilters(defaults);
        setSort('popularity-desc');
        setSearchParams({}, { replace: true });
    }, [setSearchParams]);

    /* Filtering + sorting (memoized) */
    const filteredProducts = useMemo(() => {
        let products = [...mockProducts];

        if (filters.search) {
            const q = filters.search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                p.brand.toLowerCase().includes(q)
            );
        }
        if (filters.category) products = products.filter(p => p.category === filters.category);
        if (filters.colors.length) products = products.filter(p => p.colors.some(c => filters.colors.includes(c)));
        if (filters.sizes.length) products = products.filter(p => p.sizes.length === 0 || p.sizes.some(s => filters.sizes.includes(s)));
        if (filters.brands.length) products = products.filter(p => filters.brands.includes(p.brand));
        if (filters.badge === 'onSale') products = products.filter(p => p.discount > 0);
        else if (filters.badge) products = products.filter(p => p.badge === filters.badge);
        if (filters.inStock) products = products.filter(p => p.inStock);
        products = products.filter(p => p.price >= filters.price[0] && p.price <= filters.price[1]);

        switch (sort) {
            case 'price-asc': products.sort((a, b) => a.price - b.price); break;
            case 'price-desc': products.sort((a, b) => b.price - a.price); break;
            case 'name-asc': products.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'newest': products.sort((a, b) => (b.badge === 'new' ? 1 : 0) - (a.badge === 'new' ? 1 : 0)); break;
            case 'rating-desc': products.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
            default: products.sort((a, b) => b.popularity - a.popularity);
        }
        return products;
    }, [filters, sort]);

    /* Paginated visible products */
    const visibleProducts = useMemo(() =>
        filteredProducts.slice(0, page * productsPerPage),
        [filteredProducts, page]
    );

    /* Reset page on filter change */
    useEffect(() => { setPage(1); }, [filteredProducts]);

    /* Infinite scroll */
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && visibleProducts.length < filteredProducts.length) {
                setIsLoading(true);
                setTimeout(() => {
                    setPage(prev => prev + 1);
                    setIsLoading(false);
                }, 400);
            }
        }, { threshold: 0.1 });
        if (observerRef.current) observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [visibleProducts.length, filteredProducts.length]);

    /* Active filter chips */
    const activeFilters = useMemo(() => {
        const chips = [];
        if (filters.search) chips.push({ key: 'search', label: `"${filters.search}"` });
        if (filters.category) chips.push({ key: 'category', label: filters.category });
        filters.colors.forEach(c => chips.push({ key: 'colors', label: c, value: c }));
        filters.sizes.forEach(s => chips.push({ key: 'sizes', label: s, value: s }));
        filters.brands.forEach(b => chips.push({ key: 'brands', label: b, value: b }));
        if (filters.badge) chips.push({ key: 'badge', label: filters.badge === 'onSale' ? t('onSale') : t(`badge${filters.badge.charAt(0).toUpperCase() + filters.badge.slice(1)}`) });
        if (filters.inStock) chips.push({ key: 'inStock', label: t('inStockOnly') });
        if (filters.price[0] > PRICE_MIN || filters.price[1] < PRICE_MAX) chips.push({ key: 'price', label: `$${filters.price[0]} – $${filters.price[1]}` });
        return chips;
    }, [filters, t]);

    const removeFilter = useCallback((chip) => {
        setFilters(prev => {
            let next;
            if (chip.value && (chip.key === 'colors' || chip.key === 'sizes' || chip.key === 'brands')) {
                next = { ...prev, [chip.key]: prev[chip.key].filter(v => v !== chip.value) };
            } else if (chip.key === 'price') {
                next = { ...prev, price: [PRICE_MIN, PRICE_MAX] };
            } else if (chip.key === 'inStock') {
                next = { ...prev, inStock: false };
            } else {
                next = { ...prev, [chip.key]: chip.key === 'colors' || chip.key === 'sizes' || chip.key === 'brands' ? [] : '' };
            }
            syncFiltersToURL(next, sort);
            return next;
        });
    }, [sort, syncFiltersToURL]);

    /* Screen-reader announcement on filter results */
    const srAnnouncement = `${filteredProducts.length} ${t('resultsFound')}`;

    return (
        <section className="bg-warm-200 dark:bg-gray-950 min-h-screen" aria-label={t('productCatalog')}>
            {/* SR-only live region for results */}
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{srAnnouncement}</div>

            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
                {/* ─── Top bar: mobile filter toggle + sort + result count ─── */}
                <div className="flex items-center justify-between py-5 border-b border-warm-400 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        {/* Mobile filter toggle */}
                        <button
                            onClick={() => setMobileFiltersOpen(true)}
                            className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-warm-400 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-warm-200 dark:hover:bg-gray-800/50 transition-colors"
                            aria-label="Open filters"
                        >
                            <Filter className="w-4 h-4" />
                            {t('filters')}
                            {activeFilters.length > 0 && (
                                <span className="bg-accent-900 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{activeFilters.length}</span>
                            )}
                        </button>
                        <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                            <span className="font-semibold text-gray-900 dark:text-white">{filteredProducts.length}</span> {t('resultsFound')}
                        </p>
                    </div>

                    {/* Desktop sort + view toggle */}
                    <div className="hidden lg:flex items-center gap-4">
                        <select
                            value={sort}
                            onChange={e => handleSortChange(e.target.value)}
                            className="bg-transparent text-sm border border-warm-400 dark:border-gray-700 rounded-lg px-3 py-2 dark:bg-gray-900 focus-visible:ring-2 focus-visible:ring-accent-900 focus-visible:outline-none"
                            aria-label={t('sortBy')}
                        >
                            <option value="popularity-desc">{t('popularityDesc')}</option>
                            <option value="price-asc">{t('priceAsc')}</option>
                            <option value="price-desc">{t('priceDesc')}</option>
                            <option value="name-asc">{t('nameAsc')}</option>
                            <option value="newest">{t('newest')}</option>
                            <option value="rating-desc">{t('ratingDesc')}</option>
                        </select>
                        <div className="flex border border-warm-400 dark:border-gray-700 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-accent-900 text-white dark:bg-white dark:text-black' : 'hover:bg-warm-200 dark:hover:bg-gray-800/50'}`}
                                aria-pressed={viewMode === 'grid'}
                                aria-label="Grid view"
                            >
                                <Grid3X3 size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('bento')}
                                className={`p-2 transition-colors ${viewMode === 'bento' ? 'bg-accent-900 text-white dark:bg-white dark:text-black' : 'hover:bg-warm-200 dark:hover:bg-gray-800/50'}`}
                                aria-pressed={viewMode === 'bento'}
                                aria-label="Bento view"
                            >
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Active filter chips ─── */}
                <AnimatePresence>
                    {activeFilters.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex flex-wrap gap-2 py-4" role="list" aria-label="Active filters">
                                {activeFilters.map((chip, i) => (
                                    <motion.div
                                        key={`${chip.key}-${chip.label}-${i}`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="inline-flex items-center gap-1.5 bg-warm-50 dark:bg-gray-900 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-warm-300 dark:border-gray-800"
                                        role="listitem"
                                    >
                                        {chip.label}
                                        <button
                                            onClick={() => removeFilter(chip)}
                                            className="hover:text-red-500 transition-colors p-0.5"
                                            aria-label={`Remove filter: ${chip.label}`}
                                        >
                                            <X size={12} />
                                        </button>
                                    </motion.div>
                                ))}
                                <button
                                    onClick={resetAllFilters}
                                    className="text-xs font-medium text-gray-500 hover:text-red-500 transition-colors px-2 underline-offset-2 hover:underline"
                                >
                                    {t('clearAll')}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── Layout: sidebar + products ─── */}
                <div className="flex gap-10 pt-6 pb-20">
                    {/* Desktop sidebar */}
                    <aside className="hidden lg:block w-72 flex-shrink-0 lg:sticky lg:top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin" aria-label="Product filters">
                        <FilterContent
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onReset={resetAllFilters}
                            sort={sort}
                            onSortChange={handleSortChange}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            resultCount={filteredProducts.length}
                            t={t}
                        />
                    </aside>

                    {/* Mobile filter drawer */}
                    <MobileFilterDrawer isOpen={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)}>
                        <FilterContent
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onReset={resetAllFilters}
                            sort={sort}
                            onSortChange={handleSortChange}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            resultCount={filteredProducts.length}
                            t={t}
                        />
                    </MobileFilterDrawer>

                    {/* ─── Product grid ─── */}
                    <div className="flex-1 min-w-0" role="region" aria-label="Product results">
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">{t('noResults')}</p>
                                <button
                                    onClick={resetAllFilters}
                                    className="px-6 py-3 bg-accent-900 text-white dark:bg-white dark:text-black text-sm font-medium uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    {t('resetFilters')}
                                </button>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid'
                                ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10"
                                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 auto-rows-fr"
                            }>
                                <AnimatePresence>
                                    {visibleProducts.map(product => (
                                        <motion.div
                                            key={product.id}
                                            layout
                                            className={viewMode === 'bento' && product.id % 5 === 0 ? "lg:col-span-5 lg:row-span-2" : ""}
                                        >
                                            <ProductCard product={product} onQuickView={setQuickViewProduct} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}

                        {isLoading && (
                            <div className="text-center py-12 text-gray-500" role="status">
                                <div className="inline-flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-warm-500 border-t-accent-900 rounded-full animate-spin" />
                                    {t('loadingMoreProducts')}
                                </div>
                            </div>
                        )}
                        <div ref={observerRef} className="h-20" aria-hidden="true" />
                    </div>
                </div>
            </div>

            <QuickViewModal product={quickViewProduct} isOpen={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} />
        </section>
    );
};

export default ProductsPage;