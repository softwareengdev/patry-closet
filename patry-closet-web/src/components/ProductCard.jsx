import { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, ShoppingCart, Star, Check } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { useTranslation } from 'react-i18next';
import { COLOR_MAP } from './ProductsPage';

/* ─── Shimmer placeholder ─── */
const ShimmerPlaceholder = () => (
    <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent shimmer-wave" />
    </div>
);

/* ─── Lazy image with shimmer ─── */
const LazyImage = ({ src, alt, className, onLoad: externalOnLoad, ...props }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const imgRef = useRef(null);
    const observerRef = useRef(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        if (!imgRef.current) return;
        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observerRef.current?.disconnect();
                }
            },
            { rootMargin: '200px' }
        );
        observerRef.current.observe(imgRef.current);
        return () => observerRef.current?.disconnect();
    }, []);

    const handleLoad = useCallback(() => {
        setLoaded(true);
        externalOnLoad?.();
    }, [externalOnLoad]);

    return (
        <div ref={imgRef} className="relative w-full h-full">
            {!loaded && !error && <ShimmerPlaceholder />}
            {inView && (
                <img
                    src={src}
                    alt={alt}
                    className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={handleLoad}
                    onError={() => setError(true)}
                    {...props}
                />
            )}
            {error && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-sm">
                    Image unavailable
                </div>
            )}
        </div>
    );
};

/* ─── Badge component ─── */
const ProductBadge = ({ badge, discount }) => {
    if (discount > 0) {
        return (
            <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                -{discount}%
            </span>
        );
    }
    if (badge === 'new') {
        return (
            <span className="absolute top-3 left-3 z-10 bg-black text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                New
            </span>
        );
    }
    if (badge === 'bestSeller') {
        return (
            <span className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                Best Seller
            </span>
        );
    }
    return null;
};

/* ─── Color swatches ─── */
const ColorSwatches = ({ colors, selected, onSelect, compact = false }) => {
    const maxVisible = compact ? 4 : colors.length;
    const visible = colors.slice(0, maxVisible);
    const remaining = colors.length - maxVisible;

    return (
        <div className="flex items-center gap-1.5">
            {visible.map((colorName) => {
                const hex = COLOR_MAP[colorName] || '#ccc';
                const isSelected = selected === colorName;
                const isLight = ['Blanco', 'Crema', 'Beige', 'Lavanda'].includes(colorName);

                return (
                    <button
                        key={colorName}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(colorName); }}
                        className={`relative w-5 h-5 rounded-full transition-all duration-200 ${isSelected ? 'ring-2 ring-offset-1 ring-black dark:ring-white scale-110' : 'hover:scale-110'} ${isLight ? 'border border-gray-300' : ''}`}
                        style={{ backgroundColor: hex }}
                        title={colorName}
                        aria-label={colorName}
                    >
                        {isSelected && (
                            <Check className={`absolute inset-0 m-auto w-3 h-3 ${isLight ? 'text-gray-800' : 'text-white'}`} strokeWidth={3} />
                        )}
                    </button>
                );
            })}
            {remaining > 0 && (
                <span className="text-[10px] text-gray-400 font-medium ml-0.5">+{remaining}</span>
            )}
        </div>
    );
};

/* ─── Size quick-select strip ─── */
const SizeStrip = ({ sizes, onSelect }) => {
    if (!sizes || sizes.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 px-3 py-2.5 z-10"
        >
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {sizes.map((size) => (
                    <button
                        key={size}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(size); }}
                        className="px-2.5 py-1 text-[11px] font-medium border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200 uppercase tracking-wide"
                    >
                        {size}
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

/* ─── Star rating mini ─── */
const MiniRating = ({ rating, count }) => (
    <div className="flex items-center gap-1">
        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
        <span className="text-[11px] text-gray-500 font-medium">{rating}</span>
        <span className="text-[11px] text-gray-400">({count})</span>
    </div>
);

/* ─── Main ProductCard ─── */
const ProductCard = ({ product, onQuickView }) => {
    const { addToCart } = useContext(CartContext);
    const { toggleWishlist, isInWishlist } = useContext(WishlistContext);
    const { t } = useTranslation();

    const [isHovered, setIsHovered] = useState(false);
    const [selectedColor, setSelectedColor] = useState(product.color || product.colors?.[0] || '');
    const [showAddedFeedback, setShowAddedFeedback] = useState(false);
    const [wishlistAnimating, setWishlistAnimating] = useState(false);
    const hoverTimeoutRef = useRef(null);

    const colors = product.colors || [];
    const sizes = product.sizes || [];
    const hasDiscount = product.discount > 0 && product.originalPrice;
    const wishlisted = isInWishlist(product.id);

    const handleMouseEnter = () => {
        hoverTimeoutRef.current = setTimeout(() => setIsHovered(true), 50);
    };
    const handleMouseLeave = () => {
        clearTimeout(hoverTimeoutRef.current);
        setIsHovered(false);
    };

    const handleQuickAdd = (size) => {
        addToCart(product, size || product.size || 'M', selectedColor);
        setShowAddedFeedback(true);
        setTimeout(() => setShowAddedFeedback(false), 1800);
    };

    const handleQuickViewClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onQuickView(product);
    };

    const handleWishlistClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setWishlistAnimating(true);
        toggleWishlist(product);
        setTimeout(() => setWishlistAnimating(false), 600);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="group relative bg-white dark:bg-gray-900 overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* ─── Image Area ─── */}
            <Link to={`/products/${product.id}`} className="block relative overflow-hidden aspect-[3/4]">
                {/* Badge */}
                <ProductBadge badge={product.badge} discount={product.discount || 0} />

                {/* Main image */}
                <LazyImage
                    src={product.image}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Hover image (crossfade) */}
                {product.hoverImage && (
                    <LazyImage
                        src={product.hoverImage}
                        alt={`${product.name} - hover`}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                    />
                )}

                {/* Wishlist button */}
                <button
                    onClick={handleWishlistClick}
                    className="absolute top-3 right-3 z-10 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 shadow-sm"
                    aria-label={t('wishlist')}
                >
                    <motion.div animate={wishlistAnimating ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.4 }}>
                        <Heart
                            className={`w-4 h-4 transition-colors duration-200 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-400'}`}
                        />
                    </motion.div>
                </button>

                {/* Quick view button (on hover) */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.button
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.2 }}
                            onClick={handleQuickViewClick}
                            className="absolute top-3 right-12 z-10 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 shadow-sm"
                            aria-label="Quick view"
                        >
                            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Quick-add size strip (on hover) */}
                <AnimatePresence>
                    {isHovered && sizes.length > 0 && !showAddedFeedback && (
                        <SizeStrip sizes={sizes} onSelect={handleQuickAdd} />
                    )}
                </AnimatePresence>

                {/* Quick-add button for no-size products (accessories) */}
                <AnimatePresence>
                    {isHovered && sizes.length === 0 && !showAddedFeedback && (
                        <motion.button
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickAdd('-'); }}
                            className="absolute bottom-0 left-0 right-0 bg-black/90 dark:bg-white/90 text-white dark:text-black py-3 text-xs font-medium uppercase tracking-wider text-center z-10 hover:bg-black dark:hover:bg-white transition-colors"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <ShoppingCart className="w-3.5 h-3.5" />
                                {t('addToCart')}
                            </span>
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Added feedback overlay */}
                <AnimatePresence>
                    {showAddedFeedback && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-0 left-0 right-0 bg-emerald-500 text-white py-3 text-xs font-medium uppercase tracking-wider text-center z-10"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Check className="w-3.5 h-3.5" />
                                {t('addedToCart')}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Link>

            {/* ─── Product Info ─── */}
            <div className="px-1 pt-3 pb-4">
                {/* Color swatches */}
                {colors.length > 0 && (
                    <div className="mb-2">
                        <ColorSwatches
                            colors={colors}
                            selected={selectedColor}
                            onSelect={setSelectedColor}
                            compact
                        />
                    </div>
                )}

                {/* Name + Link */}
                <Link to={`/products/${product.id}`} className="block">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug line-clamp-1 hover:underline decoration-1 underline-offset-2">
                        {product.name}
                    </h3>
                </Link>

                {/* Price row */}
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm font-bold ${hasDiscount ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                        ${product.price.toFixed(2)}
                    </span>
                    {hasDiscount && (
                        <span className="text-sm text-gray-400 line-through font-normal">
                            ${product.originalPrice.toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Rating */}
                {product.rating && (
                    <div className="mt-1.5">
                        <MiniRating rating={product.rating} count={product.reviewCount || 0} />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ProductCard;