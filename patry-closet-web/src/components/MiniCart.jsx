import { useContext, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CartContext } from '../context/CartContext';
import { COLOR_MAP } from '../data/products';

const MiniCart = () => {
    const { t } = useTranslation();
    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        getSubtotal,
        getShipping,
        getDiscount,
        getGrandTotal,
        getItemCount,
        coupon,
        miniCartOpen,
        setMiniCartOpen,
    } = useContext(CartContext);

    const panelRef = useRef(null);

    useEffect(() => {
        if (!miniCartOpen) return;
        document.body.style.overflow = 'hidden';
        const handleEsc = (e) => { if (e.key === 'Escape') setMiniCartOpen(false); };
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleEsc);
        };
    }, [miniCartOpen, setMiniCartOpen]);

    return (
        <AnimatePresence>
            {miniCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setMiniCartOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]"
                    />

                    {/* Panel */}
                    <motion.div
                        ref={panelRef}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-warm-50 dark:bg-gray-900 shadow-2xl z-[56] flex flex-col"
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('cart')}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-300 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t('cart')} ({getItemCount()})
                                </h2>
                            </div>
                            <button
                                onClick={() => setMiniCartOpen(false)}
                                className="p-2 rounded-full hover:bg-warm-300 dark:hover:bg-gray-800 transition-colors"
                                aria-label={t('close')}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Empty State */}
                        {cartItems.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-warm-300 dark:bg-gray-800 flex items-center justify-center mb-4">
                                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('emptyCart')}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('emptyCartMessage')}</p>
                                <Link
                                    to="/products"
                                    onClick={() => setMiniCartOpen(false)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-900 text-white rounded-xl text-sm font-medium hover:bg-accent-800 transition-colors"
                                >
                                    {t('shopNow')} <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* Cart Items */}
                                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
                                    <AnimatePresence initial={false}>
                                        {cartItems.map((item) => (
                                            <motion.div
                                                key={`${item.id}-${item.size}-${item.color}`}
                                                layout
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="flex gap-4 group"
                                            >
                                                {/* Image */}
                                                <Link
                                                    to={`/products/${item.id}`}
                                                    onClick={() => setMiniCartOpen(false)}
                                                    className="flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden bg-warm-300 dark:bg-gray-800"
                                                >
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </Link>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <Link
                                                        to={`/products/${item.id}`}
                                                        onClick={() => setMiniCartOpen(false)}
                                                        className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 hover:underline"
                                                    >
                                                        {item.name}
                                                    </Link>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {item.color && item.color !== '-' && (
                                                            <div className="flex items-center gap-1">
                                                                <span
                                                                    className="w-3 h-3 rounded-full border border-warm-400 dark:border-gray-600"
                                                                    style={{ backgroundColor: COLOR_MAP[item.color] || item.color }}
                                                                />
                                                                <span className="text-xs text-gray-500">{item.color}</span>
                                                            </div>
                                                        )}
                                                        {item.size && item.size !== '-' && (
                                                            <span className="text-xs text-gray-500">{t('size')}: {item.size}</span>
                                                        )}
                                                    </div>

                                                    {/* Quantity & Price */}
                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="flex items-center border border-warm-400 dark:border-gray-700 rounded-lg">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                                                                disabled={item.quantity <= 1}
                                                                className="p-1.5 hover:bg-warm-300 dark:hover:bg-gray-800 rounded-l-lg disabled:opacity-30 transition-colors"
                                                                aria-label={t('decreaseQuantity')}
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                                                                className="p-1.5 hover:bg-warm-300 dark:hover:bg-gray-800 rounded-r-lg transition-colors"
                                                                aria-label={t('increaseQuantity')}
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                ${(item.price * item.quantity).toFixed(2)}
                                                            </p>
                                                            {item.quantity > 1 && (
                                                                <p className="text-[11px] text-gray-400">${item.price.toFixed(2)} ea</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remove */}
                                                <button
                                                    onClick={() => removeFromCart(item.id, item.size, item.color)}
                                                    className="self-start p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    aria-label={`${t('remove')} ${item.name}`}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Footer Summary */}
                                <div className="border-t border-warm-300 dark:border-gray-800 px-6 py-4 space-y-3 bg-warm-200/50 dark:bg-gray-800/30">
                                    {/* Coupon indicator */}
                                    {coupon && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm">
                                            <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">{coupon.code}</span>
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                {coupon.type === 'percent' ? `-${coupon.value}%` : t('freeShipping')}
                                            </span>
                                        </div>
                                    )}

                                    {/* Totals */}
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                            <span>{t('subtotal')}</span>
                                            <span>${getSubtotal().toFixed(2)}</span>
                                        </div>
                                        {getDiscount() > 0 && (
                                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                                <span>{t('discount')}</span>
                                                <span>-${getDiscount().toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                            <span>{t('shipping')}</span>
                                            <span>{getShipping() === 0 ? t('free') : `$${getShipping().toFixed(2)}`}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-2 border-t border-warm-400 dark:border-gray-700">
                                        <span className="font-semibold text-gray-900 dark:text-white">{t('total')}</span>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">${getGrandTotal().toFixed(2)}</span>
                                    </div>

                                    {/* Free shipping progress */}
                                    {getSubtotal() < 50 && (
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {t('freeShippingProgress', { amount: (50 - getSubtotal()).toFixed(2) })}
                                            </p>
                                            <div className="w-full h-1.5 bg-warm-400 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent-900 dark:bg-white rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (getSubtotal() / 50) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="space-y-2 pt-1">
                                        <Link
                                            to="/checkout"
                                            onClick={() => setMiniCartOpen(false)}
                                            className="flex items-center justify-center gap-2 w-full py-3 bg-accent-900 text-white rounded-xl font-medium text-sm uppercase tracking-wider hover:bg-accent-800 transition-colors active:scale-[0.98]"
                                        >
                                            {t('checkout')} <ArrowRight className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            to="/cart"
                                            onClick={() => setMiniCartOpen(false)}
                                            className="flex items-center justify-center w-full py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        >
                                            {t('viewCart')}
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MiniCart;
