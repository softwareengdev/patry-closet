import { useContext, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Trash2, Share2, Bell, BellRing, ChevronRight, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WishlistContext } from '../context/WishlistContext';
import { CartContext } from '../context/CartContext';
import { mockProducts, COLOR_MAP } from '../data/products';
import ProductCard from './ProductCard';

const WishlistPage = () => {
    const { t } = useTranslation();
    const {
        wishlistItems,
        removeFromWishlist,
        clearWishlist,
        getShareableLink,
        loadSharedWishlist,
        requestStockNotification,
        stockNotifications,
        isInWishlist,
    } = useContext(WishlistContext);
    const { addToCart } = useContext(CartContext);
    const [searchParams] = useSearchParams();
    const [moveSuccess, setMoveSuccess] = useState(null);
    const [shareTooltip, setShareTooltip] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState({});

    // Load shared wishlist on mount
    const sharedParam = searchParams.get('shared');
    const isSharedView = !!sharedParam;

    const displayItems = isSharedView
        ? (() => {
            try {
                const ids = JSON.parse(atob(sharedParam));
                return mockProducts.filter(p => ids.includes(p.id));
            } catch { return []; }
        })()
        : wishlistItems;

    const handleMoveToCart = (product) => {
        const size = selectedSizes[product.id] || product.sizes?.[0] || '-';
        const color = product.colors?.[0] || product.color || 'Negro';
        addToCart(product, size, color);
        removeFromWishlist(product.id);
        setMoveSuccess(product.id);
        setTimeout(() => setMoveSuccess(null), 2000);
    };

    const handleShare = async () => {
        const link = getShareableLink();
        try {
            if (navigator.share) {
                await navigator.share({ title: 'My Patry Closet Wishlist', url: link });
            } else {
                await navigator.clipboard.writeText(link);
                setShareTooltip(true);
                setTimeout(() => setShareTooltip(false), 2000);
            }
        } catch {
            await navigator.clipboard.writeText(link);
            setShareTooltip(true);
            setTimeout(() => setShareTooltip(false), 2000);
        }
    };

    const handleNotify = async (productId) => {
        const result = await requestStockNotification(productId);
        if (!result.success) {
            alert(result.message);
        }
    };

    // Recommended products (not in wishlist)
    const recommended = mockProducts
        .filter(p => !isInWishlist(p.id))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 4);

    if (displayItems.length === 0 && !isSharedView) {
        return (
            <section className="py-20 bg-warm-100 dark:bg-gray-950 min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md px-6"
                >
                    <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border border-warm-400 dark:border-gray-800">
                        <Heart className="w-7 h-7 text-gray-400" />
                    </div>
                    <h2 className="font-serif text-3xl font-light tracking-tight text-gray-900 dark:text-white mb-2">{t('emptyWishlist')}</h2>
                    <p className="text-sm font-light text-gray-500 dark:text-gray-400 mb-8">{t('emptyWishlistMessage')}</p>
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-medium uppercase tracking-wider hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                        {t('shopNow')} <ChevronRight className="w-4 h-4" />
                    </Link>

                    {recommended.length > 0 && (
                        <div className="mt-16 text-left">
                            <span className="text-[11px] font-medium uppercase tracking-ultra-wide text-gray-400 dark:text-gray-500 block mb-2">{t('recommendations', 'Recommendations')}</span>
                            <h3 className="font-serif text-2xl font-light tracking-tight text-gray-900 dark:text-white mb-6">{t('youMightLike')}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {recommended.map(p => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </section>
        );
    }

    return (
        <section className="py-12 sm:py-16 bg-warm-100 dark:bg-gray-950 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
                    <div>
                        <span className="text-[11px] font-medium uppercase tracking-ultra-wide text-gray-400 dark:text-gray-500 mb-2 block">
                            {isSharedView ? t('sharedCollection', 'Shared Collection') : t('myCollection', 'My Collection')}
                        </span>
                        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-gray-900 dark:text-white">
                            {isSharedView ? t('sharedWishlist') : t('myWishlist')}
                            <span className="text-gray-400 font-light ml-3">({displayItems.length})</span>
                        </h1>
                    </div>
                    {!isSharedView && displayItems.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleShare}
                                    className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider border border-warm-400 dark:border-gray-700 hover:border-gray-900 dark:hover:border-white transition-colors"
                                >
                                    <Share2 className="w-3.5 h-3.5" /> {t('share')}
                                </motion.button>
                                <AnimatePresence>
                                    {shareTooltip && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs whitespace-nowrap"
                                        >
                                            {t('linkCopied')}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <button
                                onClick={clearWishlist}
                                className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-red-500 border border-warm-400 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-800 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> {t('clearAll')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Wishlist Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-warm-300 dark:bg-gray-800">
                    <AnimatePresence>
                        {displayItems.map((product) => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                className="bg-warm-50 dark:bg-gray-950 group"
                            >
                                {/* Image */}
                                <Link to={`/products/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-warm-100 dark:bg-gray-900">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    {product.badge && (
                                        <span className={`absolute top-3 left-3 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white ${
                                            product.badge === 'new' ? 'bg-black' : 'bg-rose-600'
                                        }`}>
                                            {product.badge === 'new' ? t('badgeNew') : t('badgeBestSeller')}
                                        </span>
                                    )}
                                    {!product.inStock && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <span className="px-4 py-2 bg-white/90 text-gray-900 text-[10px] font-medium uppercase tracking-wider">
                                                {t('outOfStock')}
                                            </span>
                                        </div>
                                    )}
                                </Link>

                                {/* Info */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-ultra-wide text-gray-400 dark:text-gray-500 mb-1">{product.brand}</p>
                                        <Link to={`/products/${product.id}`}>
                                            <h3 className="font-serif text-sm font-light tracking-tight text-gray-900 dark:text-white line-clamp-1 hover:underline underline-offset-4">
                                                {product.name}
                                            </h3>
                                        </Link>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-sm font-light tracking-tight ${product.discount > 0 ? 'text-rose-600' : 'text-gray-900 dark:text-white'}`}>
                                            ${product.price.toFixed(2)}
                                        </span>
                                        {product.originalPrice && (
                                            <span className="text-xs text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
                                        )}
                                    </div>

                                    {/* Size selector */}
                                    {product.sizes?.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {product.sizes.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: size }))}
                                                    className={`px-2 py-1 text-[10px] uppercase tracking-wider border transition-all ${
                                                        (selectedSizes[product.id] || product.sizes[0]) === size
                                                            ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black'
                                                            : 'border-warm-400 dark:border-gray-700 hover:border-gray-900 dark:hover:border-white'
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Color swatches */}
                                    {product.colors?.length > 0 && (
                                        <div className="flex gap-1.5">
                                            {product.colors.slice(0, 5).map(c => (
                                                <div
                                                    key={c}
                                                    className="w-4 h-4 rounded-full border border-warm-400 dark:border-gray-600"
                                                    style={{ backgroundColor: COLOR_MAP[c] || c }}
                                                    title={c}
                                                />
                                            ))}
                                            {product.colors.length > 5 && (
                                                <span className="text-[10px] text-gray-400 self-center">+{product.colors.length - 5}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-1">
                                        {product.inStock ? (
                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleMoveToCart(product)}
                                                disabled={moveSuccess === product.id}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-medium uppercase tracking-wider transition-all ${
                                                    moveSuccess === product.id
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100'
                                                }`}
                                            >
                                                {moveSuccess === product.id ? (
                                                    <>✓ {t('addedToCart')}</>
                                                ) : (
                                                    <><ShoppingCart className="w-3.5 h-3.5" /> {t('moveToCart')}</>
                                                )}
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleNotify(product.id)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-medium uppercase tracking-wider border transition-all ${
                                                    stockNotifications?.has?.(product.id)
                                                        ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                                        : 'border-warm-400 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-900 dark:hover:border-white'
                                                }`}
                                            >
                                                {stockNotifications?.has?.(product.id) ? (
                                                    <><BellRing className="w-3.5 h-3.5" /> {t('notifySet')}</>
                                                ) : (
                                                    <><Bell className="w-3.5 h-3.5" /> {t('notifyMe')}</>
                                                )}
                                            </motion.button>
                                        )}
                                        {!isSharedView && (
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => removeFromWishlist(product.id)}
                                                className="w-10 h-10 flex items-center justify-center border border-warm-400 dark:border-gray-700 text-gray-300 hover:text-red-500 hover:border-red-300 dark:hover:border-red-800 transition-colors"
                                                aria-label={t('removeFromWishlist')}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Recommendations */}
                {!isSharedView && recommended.length > 0 && (
                    <div className="mt-20">
                        <span className="text-[11px] font-medium uppercase tracking-ultra-wide text-gray-400 dark:text-gray-500 block mb-2">{t('recommendations', 'Recommendations')}</span>
                        <h2 className="font-serif text-3xl sm:text-4xl font-light tracking-tight text-gray-900 dark:text-white mb-8">{t('youMightLike')}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                            {recommended.map(p => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default WishlistPage;
