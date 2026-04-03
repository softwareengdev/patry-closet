import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, TrendingUp, X, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { mockProducts } from '../data/products';

const RECENT_SEARCHES_KEY = 'patry-recent-searches';
const MAX_RECENT = 5;
const MAX_PRODUCT_RESULTS = 5;
const DEBOUNCE_MS = 250;

const TRENDING_SEARCHES = ['Vestido', 'Sneakers', 'Bolso', 'Blazer', 'Leggings'];

const CATEGORY_SUGGESTIONS = [
    { label: 'Mujeres', icon: '👗', path: '/products?category=Mujeres' },
    { label: 'Hombres', icon: '👔', path: '/products?category=Hombres' },
    { label: 'Accesorios', icon: '💎', path: '/products?category=Accesorios' },
];

/* ─── Utility: recent searches from localStorage ─── */
const getRecentSearches = () => {
    try {
        return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || [];
    } catch { return []; }
};

const saveRecentSearch = (term) => {
    const recent = getRecentSearches().filter(s => s !== term);
    recent.unshift(term);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
};

const clearRecentSearches = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
};

/* ─── Highlight matching text ─── */
const HighlightMatch = ({ text, query }) => {
    if (!query) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="bg-yellow-200 dark:bg-yellow-800/40 text-inherit rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
            {text.slice(idx + query.length)}
        </>
    );
};

/* ─── Main SearchAutocomplete ─── */
const SearchAutocomplete = ({ isOpen, onClose, isHighContrast }) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState(getRecentSearches);

    const inputRef = useRef(null);
    const listRef = useRef(null);
    const debounceRef = useRef(null);
    const navigate = useNavigate();
    const { t } = useTranslation();

    /* Focus input on open */
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setDebouncedQuery('');
            setActiveIndex(-1);
            setRecentSearches(getRecentSearches());
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    /* Debounced query */
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
        return () => clearTimeout(debounceRef.current);
    }, [query]);

    /* Search results */
    const productResults = useMemo(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) return [];
        const q = debouncedQuery.toLowerCase();
        return mockProducts
            .filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
            .slice(0, MAX_PRODUCT_RESULTS);
    }, [debouncedQuery]);

    const categoryResults = useMemo(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) return [];
        const q = debouncedQuery.toLowerCase();
        return CATEGORY_SUGGESTIONS.filter(c => c.label.toLowerCase().includes(q));
    }, [debouncedQuery]);

    const hasResults = productResults.length > 0 || categoryResults.length > 0;
    const showRecent = !debouncedQuery && recentSearches.length > 0;
    const showTrending = !debouncedQuery;

    /* All navigable items for keyboard */
    const allItems = useMemo(() => {
        const items = [];
        if (showTrending) TRENDING_SEARCHES.forEach(s => items.push({ type: 'trending', value: s }));
        if (showRecent) recentSearches.forEach(s => items.push({ type: 'recent', value: s }));
        categoryResults.forEach(c => items.push({ type: 'category', value: c }));
        productResults.forEach(p => items.push({ type: 'product', value: p }));
        if (debouncedQuery && debouncedQuery.length >= 2) items.push({ type: 'viewAll', value: debouncedQuery });
        return items;
    }, [showTrending, showRecent, recentSearches, categoryResults, productResults, debouncedQuery]);

    const handleSubmit = useCallback((term) => {
        const searchTerm = (term || query).trim();
        if (!searchTerm) return;
        saveRecentSearch(searchTerm);
        navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
        onClose();
    }, [query, navigate, onClose]);

    const handleProductClick = useCallback((product) => {
        saveRecentSearch(product.name);
        navigate(`/products/${product.id}`);
        onClose();
    }, [navigate, onClose]);

    const handleCategoryClick = useCallback((cat) => {
        navigate(cat.path);
        onClose();
    }, [navigate, onClose]);

    /* Keyboard navigation */
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => Math.min(prev + 1, allItems.length - 1));
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => Math.max(prev - 1, -1));
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < allItems.length) {
                const item = allItems[activeIndex];
                if (item.type === 'product') handleProductClick(item.value);
                else if (item.type === 'category') handleCategoryClick(item.value);
                else if (item.type === 'viewAll') handleSubmit(item.value);
                else handleSubmit(item.value);
            } else {
                handleSubmit();
            }
        }
    }, [activeIndex, allItems, handleSubmit, handleProductClick, handleCategoryClick, onClose]);

    /* Scroll active item into view */
    useEffect(() => {
        if (activeIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[data-search-item]');
            items[activeIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);

    const handleClearRecent = () => {
        clearRecentSearches();
        setRecentSearches([]);
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`overflow-hidden border-t ${isHighContrast ? 'border-hc-border bg-hc-bg' : 'border-warm-300 dark:border-gray-800 bg-warm-50 dark:bg-gray-950'}`}
        >
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
                {/* Search input */}
                <div className="flex items-center gap-4 py-4">
                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    <input
                        ref={inputRef}
                        type="search"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setActiveIndex(-1); }}
                        onKeyDown={handleKeyDown}
                        placeholder={t('searchProducts')}
                        className="flex-1 bg-transparent text-lg font-light outline-none placeholder:text-gray-400"
                        role="combobox"
                        aria-expanded={allItems.length > 0}
                        aria-controls="search-listbox"
                        aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
                        aria-autocomplete="list"
                        autoComplete="off"
                    />
                    {query && (
                        <button onClick={() => { setQuery(''); setDebouncedQuery(''); }} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Clear search">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Close search">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Results dropdown */}
                <div ref={listRef} id="search-listbox" role="listbox" className="pb-6 max-h-[60vh] overflow-y-auto">
                    {/* Trending */}
                    {showTrending && (
                        <div className="mb-6">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5" /> {t('trendingSearches')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {TRENDING_SEARCHES.map((term, i) => {
                                    const itemIndex = i;
                                    return (
                                        <button
                                            key={term}
                                            data-search-item
                                            id={`search-item-${itemIndex}`}
                                            role="option"
                                            aria-selected={activeIndex === itemIndex}
                                            onClick={() => handleSubmit(term)}
                                            className={`px-3 py-1.5 text-sm border rounded-full transition-colors ${activeIndex === itemIndex ? 'bg-accent-900 text-white border-accent-900 dark:bg-white dark:text-black' : 'border-warm-400 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-warm-500'}`}
                                        >
                                            {term}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Recent searches */}
                    {showRecent && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" /> {t('recentSearches')}
                                </p>
                                <button onClick={handleClearRecent} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                                    {t('clearAll')}
                                </button>
                            </div>
                            <div className="space-y-1">
                                {recentSearches.map((term, i) => {
                                    const itemIndex = (showTrending ? TRENDING_SEARCHES.length : 0) + i;
                                    return (
                                        <button
                                            key={term}
                                            data-search-item
                                            id={`search-item-${itemIndex}`}
                                            role="option"
                                            aria-selected={activeIndex === itemIndex}
                                            onClick={() => handleSubmit(term)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeIndex === itemIndex ? 'bg-warm-300 dark:bg-gray-800' : 'hover:bg-warm-200 dark:hover:bg-gray-800/50'}`}
                                        >
                                            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-700 dark:text-gray-300">{term}</span>
                                            <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Category results */}
                    {categoryResults.length > 0 && (
                        <div className="mb-6">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">{t('categories')}</p>
                            <div className="space-y-1">
                                {categoryResults.map((cat, i) => {
                                    const baseIdx = (showTrending ? TRENDING_SEARCHES.length : 0) + (showRecent ? recentSearches.length : 0);
                                    const itemIndex = baseIdx + i;
                                    return (
                                        <button
                                            key={cat.label}
                                            data-search-item
                                            id={`search-item-${itemIndex}`}
                                            role="option"
                                            aria-selected={activeIndex === itemIndex}
                                            onClick={() => handleCategoryClick(cat)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeIndex === itemIndex ? 'bg-warm-300 dark:bg-gray-800' : 'hover:bg-warm-200 dark:hover:bg-gray-800/50'}`}
                                        >
                                            <span className="text-lg">{cat.icon}</span>
                                            <span className="font-medium">
                                                <HighlightMatch text={cat.label} query={debouncedQuery} />
                                            </span>
                                            <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Product results */}
                    {productResults.length > 0 && (
                        <div className="mb-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">{t('products')}</p>
                            <div className="space-y-1">
                                {productResults.map((product, i) => {
                                    const baseIdx = (showTrending ? TRENDING_SEARCHES.length : 0) + (showRecent ? recentSearches.length : 0) + categoryResults.length;
                                    const itemIndex = baseIdx + i;
                                    return (
                                        <button
                                            key={product.id}
                                            data-search-item
                                            id={`search-item-${itemIndex}`}
                                            role="option"
                                            aria-selected={activeIndex === itemIndex}
                                            onClick={() => handleProductClick(product)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeIndex === itemIndex ? 'bg-warm-300 dark:bg-gray-800' : 'hover:bg-warm-200 dark:hover:bg-gray-800/50'}`}
                                        >
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-10 h-10 object-cover rounded"
                                                loading="lazy"
                                            />
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                    <HighlightMatch text={product.name} query={debouncedQuery} />
                                                </p>
                                                <p className="text-xs text-gray-500">{product.category} · {product.brand}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`font-semibold ${product.discount > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                                                    ${product.price.toFixed(2)}
                                                </p>
                                                {product.originalPrice && (
                                                    <p className="text-xs text-gray-400 line-through">${product.originalPrice.toFixed(2)}</p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* View all results link */}
                    {debouncedQuery && debouncedQuery.length >= 2 && (
                        <button
                            data-search-item
                            id={`search-item-${allItems.length - 1}`}
                            role="option"
                            aria-selected={activeIndex === allItems.length - 1}
                            onClick={() => handleSubmit()}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeIndex === allItems.length - 1 ? 'bg-accent-900 text-white dark:bg-white dark:text-black' : 'bg-warm-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-warm-400 dark:hover:bg-gray-700'}`}
                        >
                            {t('viewAllResults')} "{debouncedQuery}"
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}

                    {/* No results */}
                    {debouncedQuery && debouncedQuery.length >= 2 && !hasResults && (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noSearchResults')} "{debouncedQuery}"</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default SearchAutocomplete;
