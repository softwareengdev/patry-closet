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
import SEOHead, { getCollectionPageSchema, getBreadcrumbSchema } from './SEOHead';
import { mockProducts, COLOR_MAP } from '../data/products';
import { useProducts, useCategories } from '../hooks/useProducts';

/* ─── Derive available facet values from product data ─── */
const ALL_CATEGORIES = [...new Set(mockProducts.map(p => p.category))];
const ALL_SUBCATEGORIES = [...new Set(mockProducts.map(p => p.subcategory))];
const ALL_COLORS = [...new Set(mockProducts.flatMap(p => p.colors))];
const ALL_SIZES = [...new Set(mockProducts.flatMap(p => p.sizes).filter(Boolean))];
const ALL_BRANDS = [...new Set(mockProducts.map(p => p.brand))];
const PRICE_MIN = 0;
const PRICE_MAX = 250;

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

    /* Build API filters from component state */
    const apiFilters = useMemo(() => ({
        search: filters.search || undefined,
        category: filters.category || undefined,
        color: filters.colors?.length === 1 ? filters.colors[0] : undefined,
        size: filters.sizes?.length === 1 ? filters.sizes[0] : undefined,
        brand: filters.brands?.length === 1 ? filters.brands[0] : undefined,
        badge: filters.badge || undefined,
        inStock: filters.inStock || undefined,
        minPrice: filters.price?.[0] > 0 ? filters.price[0] : undefined,
        maxPrice: filters.price?.[1] < 250 ? filters.price[1] : undefined,
        sortBy: sort.split('-')[0] || 'popularity',
        sortDirection: sort.split('-')[1] || 'desc',
        page: page,
        pageSize: productsPerPage,
    }), [filters, sort, page]);

    const { data: apiResult, isLoading: apiLoading, isFetching } = useProducts(apiFilters);

    /* Use API data when available, fall back to client-side filtering of mockProducts */
    const filteredProducts = useMemo(() => {
        if (apiResult?.data?.length > 0) {
            return apiResult.data;
        }
        // Fallback: client-side filtering (existing logic)
        let products = [...mockProducts];

        if (filters.search) {
            const q = filters.search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                p.brand.toLowerCase().includes(q) ||
                (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
                (p.description && p.description.toLowerCase().includes(q))
            );
        }
        if (filters.category) products = products.filter(p => p.category === filters.category || p.subcategory === filters.category);
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
    }, [apiResult, filters, sort]);

    /* Pagination from API or client-side */
    const totalFromApi = apiResult?.pagination?.totalCount;
    const totalProducts = totalFromApi ?? filteredProducts.length;

    /* Paginated visible products */
    const visibleProducts = useMemo(() => {
        // API data is already paginated — show all items from the response
        if (totalFromApi != null) {
            return filteredProducts;
        }
        // Fallback: client-side infinite scroll pagination
        return filteredProducts.slice(0, page * productsPerPage);
    }, [filteredProducts, page, totalFromApi]);

    /* Reset page on filter/sort change */
    useEffect(() => { setPage(1); }, [filters, sort]);

    /* Infinite scroll */
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                const hasMoreApi = totalFromApi != null && apiResult?.pagination?.hasNext;
                const hasMoreFallback = totalFromApi == null && visibleProducts.length < filteredProducts.length;
                if (hasMoreApi || hasMoreFallback) {
                    setIsLoading(true);
                    setTimeout(() => {
                        setPage(prev => prev + 1);
                        setIsLoading(false);
                    }, 400);
                }
            }
        }, { threshold: 0.1 });
        if (observerRef.current) observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [visibleProducts.length, filteredProducts.length, totalFromApi, apiResult]);

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
    const srAnnouncement = `${totalProducts} ${t('resultsFound')}`;

    return (
        <section className="bg-warm-200 dark:bg-gray-950 min-h-screen" aria-label={t('productCatalog')}>
            <SEOHead
                title="Catálogo de Moda — Ropa Mujer, Vestidos, Accesorios"
                description="Explora el catálogo completo de PATRY♡CLOSET: vestidos, tops, pantalones, faldas, bolsos, zapatos y accesorios de las últimas tendencias. Moda online premium con envío gratuito en pedidos +50€."
                canonical="/products"
                jsonLd={[
                    getCollectionPageSchema('Catálogo de Moda Patry Closet', 'Colección completa de ropa de mujer y accesorios de moda premium', filteredProducts),
                    getBreadcrumbSchema([{ name: 'Inicio', url: '/' }, { name: 'Catálogo' }]),
                ]}
            />
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
                            <span className="font-semibold text-gray-900 dark:text-white">{totalProducts}</span> {t('resultsFound')}
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
                            resultCount={totalProducts}
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
                            resultCount={totalProducts}
                            t={t}
                        />
                    </MobileFilterDrawer>

                    {/* ─── Product grid ─── */}
                    <div className={`flex-1 min-w-0 transition-opacity${isFetching ? ' opacity-60' : ''}`} role="region" aria-label="Product results">
                        {filteredProducts.length === 0 && !apiLoading ? (
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