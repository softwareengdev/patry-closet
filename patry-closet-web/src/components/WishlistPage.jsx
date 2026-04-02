import { useContext, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Trash2, Share2, Bell, BellRing, ChevronRight, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WishlistContext } from '../context/WishlistContext';
import { CartContext } from '../context/CartContext';
import { mockProducts, COLOR_MAP } from './ProductsPage';
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
            <section className="py-20 bg-warm-200 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md px-6"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose/10 flex items-center justify-center">
                        <Heart className="w-10 h-10 text-rose" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('emptyWishlist')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{t('emptyWishlistMessage')}</p>
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-accent-900 text-white rounded-xl font-medium hover:bg-accent-800 transition-colors"
                    >
                        {t('shopNow')} <ChevronRight className="w-4 h-4" />
                    </Link>

                    {recommended.length > 0 && (
                        <div className="mt-16 text-left">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('youMightLike')}</h3>
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
        <section className="py-8 bg-warm-200 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {isSharedView ? t('sharedWishlist') : t('myWishlist')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {displayItems.length} {t('items')}
                        </p>
                    </div>
                    {!isSharedView && displayItems.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleShare}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-warm-50 dark:bg-gray-800 border border-warm-400 dark:border-gray-700 rounded-xl hover:bg-warm-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Share2 className="w-4 h-4" /> {t('share')}
                                </motion.button>
                                <AnimatePresence>
                                    {shareTooltip && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap"
                                        >
                                            {t('linkCopied')}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <button
                                onClick={clearWishlist}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-warm-50 dark:bg-gray-800 border border-warm-400 dark:border-gray-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> {t('clearAll')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Wishlist Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {displayItems.map((product) => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                className="bg-warm-50 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
                            >
                                {/* Image */}
                                <Link to={`/products/${product.id}`} className="block relative aspect-[3/4] overflow-hidden">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    {product.badge && (
                                        <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full ${
                                            product.badge === 'new' ? 'bg-emerald-500 text-white'
                                            : product.badge === 'bestSeller' ? 'bg-amber-500 text-white'
                                            : 'bg-rose text-white'
                                        }`}>
                                            {product.badge === 'new' ? t('badgeNew') : t('badgeBestSeller')}
                                        </span>
                                    )}
                                    {!product.inStock && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <span className="px-4 py-2 bg-warm-50/90 text-gray-900 text-sm font-semibold rounded-lg">
                                                {t('outOfStock')}
                                            </span>
                                        </div>
                                    )}
                                </Link>

                                {/* Info */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">{product.brand}</p>
                                        <Link to={`/products/${product.id}`}>
                                            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1 hover:underline">
                                                {product.name}
                                            </h3>
                                        </Link>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-lg font-bold ${product.discount > 0 ? 'text-rose' : 'text-gray-900 dark:text-white'}`}>
                                            ${product.price.toFixed(2)}
                                        </span>
                                        {product.originalPrice && (
                                            <span className="text-sm text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
                                        )}
                                    </div>

                                    {/* Size selector (inline) */}
                                    {product.sizes?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {product.sizes.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: size }))}
                                                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                                                        (selectedSizes[product.id] || product.sizes[0]) === size
                                                            ? 'border-accent-900 dark:border-white bg-accent-900/5 dark:bg-white/5 font-semibold'
                                                            : 'border-warm-400 dark:border-gray-700 hover:border-warm-500'
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
                                                    className="w-5 h-5 rounded-full border border-warm-400 dark:border-gray-600"
                                                    style={{ backgroundColor: COLOR_MAP[c] || c }}
                                                    title={c}
                                                />
                                            ))}
                                            {product.colors.length > 5 && (
                                                <span className="text-xs text-gray-400 self-center">+{product.colors.length - 5}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-1">
                                        {product.inStock ? (
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleMoveToCart(product)}
                                                disabled={moveSuccess === product.id}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                    moveSuccess === product.id
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-accent-900 text-white hover:bg-accent-800'
                                                }`}
                                            >
                                                {moveSuccess === product.id ? (
                                                    <>✓ {t('addedToCart')}</>
                                                ) : (
                                                    <><ShoppingCart className="w-4 h-4" /> {t('moveToCart')}</>
                                                )}
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleNotify(product.id)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                    stockNotifications?.has?.(product.id)
                                                        ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                                        : 'bg-warm-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-warm-400 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                {stockNotifications?.has?.(product.id) ? (
                                                    <><BellRing className="w-4 h-4" /> {t('notifySet')}</>
                                                ) : (
                                                    <><Bell className="w-4 h-4" /> {t('notifyMe')}</>
                                                )}
                                            </motion.button>
                                        )}
                                        {!isSharedView && (
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => removeFromWishlist(product.id)}
                                                className="p-2.5 rounded-xl border border-warm-400 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                                                aria-label={t('removeFromWishlist')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Recently viewed / recommendations */}
                {!isSharedView && recommended.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('youMightLike')}</h2>
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
