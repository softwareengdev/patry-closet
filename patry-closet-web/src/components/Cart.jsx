import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, ChevronRight, Tag, X, Truck } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { COLOR_MAP } from './ProductsPage';

const Cart = () => {
    const { t } = useTranslation();
    const {
        cartItems, removeFromCart, updateQuantity,
        getSubtotal, getShipping, getTax, getDiscount, getGrandTotal, getItemCount,
        coupon, applyCoupon, removeCoupon, clearCart,
    } = useContext(CartContext);
    const [couponInput, setCouponInput] = useState('');
    const [couponMsg, setCouponMsg] = useState(null);

    const handleApplyCoupon = () => {
        const result = applyCoupon(couponInput.trim().toUpperCase());
        setCouponMsg(result);
        if (result.success) setCouponInput('');
        setTimeout(() => setCouponMsg(null), 4000);
    };

    if (cartItems.length === 0) {
        return (
            <section className="py-20 bg-warm-100 dark:bg-gray-950 min-h-screen flex items-center justify-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md px-6">
                    <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border border-warm-400 dark:border-gray-800">
                        <ShoppingBag className="w-7 h-7 text-gray-400" />
                    </div>
                    <h2 className="font-serif text-3xl font-light tracking-tight text-gray-900 dark:text-white mb-2">{t('emptyCart')}</h2>
                    <p className="text-sm font-light text-gray-500 dark:text-gray-400 mb-8">{t('emptyCartMessage')}</p>
                    <Link to="/products" className="inline-flex items-center gap-2 px-8 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-medium uppercase tracking-wider hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                        {t('shopNow')} <ChevronRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </section>
        );
    }

    return (
        <section className="py-12 sm:py-16 bg-warm-100 dark:bg-gray-950 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-[11px] uppercase tracking-ultra-wide text-gray-400 dark:text-gray-500 mb-8" aria-label="Breadcrumb">
                    <Link to="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t('home')}</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-gray-900 dark:text-white">{t('cart')}</span>
                </nav>

                {/* Header */}
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <span className="text-[11px] font-medium uppercase tracking-ultra-wide text-gray-400 dark:text-gray-500 mb-2 block">{t('cart')}</span>
                        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-gray-900 dark:text-white">
                            {t('yourCart')} <span className="text-gray-400 font-light">({getItemCount()})</span>
                        </h1>
                    </div>
                    <button onClick={clearCart} className="text-[11px] font-medium uppercase tracking-wider text-gray-400 hover:text-red-500 underline underline-offset-4 transition-colors">{t('clearAll')}</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-0 divide-y divide-warm-300 dark:divide-gray-800">
                        <AnimatePresence initial={false}>
                            {cartItems.map(item => (
                                <motion.div
                                    key={`${item.id}-${item.size}-${item.color}`}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="py-6 first:pt-0"
                                >
                                    <div className="flex gap-5">
                                        <Link to={`/products/${item.id}`} className="flex-shrink-0 w-24 h-32 sm:w-28 sm:h-36 overflow-hidden bg-warm-200 dark:bg-gray-900">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                                        </Link>
                                        <div className="flex-1 min-w-0 flex flex-col">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-ultra-wide text-gray-400 dark:text-gray-500 mb-1">{item.brand}</p>
                                                    <Link to={`/products/${item.id}`}>
                                                        <h3 className="font-serif text-base sm:text-lg font-light tracking-tight text-gray-900 dark:text-white hover:underline underline-offset-4 line-clamp-1">{item.name}</h3>
                                                    </Link>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id, item.size, item.color)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors" aria-label={`${t('remove')} ${item.name}`}>
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Variant info */}
                                            <div className="flex items-center gap-3 mt-2">
                                                {item.color && item.color !== '-' && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-3 h-3 rounded-full border border-warm-400 dark:border-gray-600" style={{ backgroundColor: COLOR_MAP[item.color] || item.color }} />
                                                        <span className="text-[11px] text-gray-400">{item.color}</span>
                                                    </div>
                                                )}
                                                {item.size && item.size !== '-' && (
                                                    <span className="text-[11px] text-gray-400 px-2 py-0.5 border border-warm-400 dark:border-gray-700">{item.size}</span>
                                                )}
                                            </div>

                                            {/* Qty + Price row */}
                                            <div className="flex items-center justify-between mt-auto pt-3">
                                                <div className="flex items-center border border-warm-400 dark:border-gray-700">
                                                    <button onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)} disabled={item.quantity <= 1} className="w-8 h-8 flex items-center justify-center hover:bg-warm-200 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors" aria-label={t('decreaseQuantity')}>
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-light">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-warm-200 dark:hover:bg-gray-800 transition-colors" aria-label={t('increaseQuantity')}>
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-base font-light tracking-tight text-gray-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                                                    {item.originalPrice && (
                                                        <p className="text-xs text-gray-400 line-through">${(item.originalPrice * item.quantity).toFixed(2)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-warm-50 dark:bg-gray-900 border border-warm-300 dark:border-gray-800 p-6 sm:p-8 sticky top-24 space-y-5">
                            <h2 className="text-[11px] font-medium uppercase tracking-ultra-wide text-gray-400 dark:text-gray-500 mb-4">{t('orderSummary')}</h2>

                            {/* Coupon */}
                            <div className="space-y-2">
                                {coupon ? (
                                    <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{coupon.code}</span>
                                        </div>
                                        <button onClick={removeCoupon} className="text-emerald-600 hover:text-red-500 transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponInput}
                                            onChange={(e) => setCouponInput(e.target.value)}
                                            placeholder={t('couponCode')}
                                            className="flex-1 px-3 py-2 text-sm font-light border border-warm-400 dark:border-gray-700 bg-transparent focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors"
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                        />
                                        <button onClick={handleApplyCoupon} className="px-4 py-2 text-[11px] font-medium uppercase tracking-wider border border-warm-400 dark:border-gray-700 hover:bg-warm-200 dark:hover:bg-gray-800 transition-colors">{t('apply')}</button>
                                    </div>
                                )}
                                {couponMsg && (
                                    <p className={`text-xs ${couponMsg.success ? 'text-emerald-600' : 'text-red-500'}`}>{couponMsg.message}</p>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 text-sm font-light">
                                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                    <span>{t('subtotal')}</span>
                                    <span>${getSubtotal().toFixed(2)}</span>
                                </div>
                                {getDiscount() > 0 && (
                                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                        <span>{t('discount')}</span>
                                        <span>-${getDiscount().toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                    <span>{t('shipping')}</span>
                                    <span>{getShipping() === 0 ? t('free') : `$${getShipping().toFixed(2)}`}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                    <span>{t('tax')} (21% IVA)</span>
                                    <span>${getTax().toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 border-t border-warm-400 dark:border-gray-700">
                                <span className="font-serif text-lg font-light tracking-tight text-gray-900 dark:text-white">{t('total')}</span>
                                <span className="font-serif text-lg font-light tracking-tight text-gray-900 dark:text-white">${getGrandTotal().toFixed(2)}</span>
                            </div>

                            {/* Free shipping bar */}
                            {getSubtotal() < 50 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                        <Truck className="w-3.5 h-3.5" />
                                        {t('freeShippingProgress', { amount: (50 - getSubtotal()).toFixed(2) })}
                                    </div>
                                    <div className="w-full h-[2px] bg-warm-400 dark:bg-gray-700 overflow-hidden">
                                        <div className="h-full bg-gray-900 dark:bg-white transition-all duration-500" style={{ width: `${Math.min(100, (getSubtotal() / 50) * 100)}%` }} />
                                    </div>
                                </div>
                            )}

                            <Link
                                to="/checkout"
                                className="flex items-center justify-center gap-2 w-full py-3.5 bg-black dark:bg-white text-white dark:text-black text-sm font-medium uppercase tracking-wider hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors active:scale-[0.98]"
                            >
                                {t('checkout')} <ArrowRight className="w-4 h-4" />
                            </Link>

                            <Link to="/products" className="flex items-center justify-center w-full text-[11px] uppercase tracking-ultra-wide text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                {t('continueShopping')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Cart;