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
            <section className="py-20 bg-warm-200 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md px-6">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-warm-300 dark:bg-gray-800 flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('emptyCart')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{t('emptyCartMessage')}</p>
                    <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-accent-900 text-white rounded-xl font-medium hover:bg-accent-800 transition-colors">
                        {t('shopNow')} <ChevronRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </section>
        );
    }

    return (
        <section className="py-8 bg-warm-200 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6" aria-label="Breadcrumb">
                    <Link to="/" className="hover:text-gray-900 dark:hover:text-white">{t('home')}</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-gray-900 dark:text-white font-medium">{t('cart')}</span>
                </nav>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('yourCart')} ({getItemCount()})</h1>
                    <button onClick={clearCart} className="text-sm text-gray-500 hover:text-red-500 transition-colors">{t('clearAll')}</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        <AnimatePresence initial={false}>
                            {cartItems.map(item => (
                                <motion.div
                                    key={`${item.id}-${item.size}-${item.color}`}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-warm-50 dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden"
                                >
                                    <div className="flex gap-4 p-4 sm:p-6">
                                        <Link to={`/products/${item.id}`} className="flex-shrink-0 w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-warm-300 dark:bg-gray-700">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">{item.brand}</p>
                                                    <Link to={`/products/${item.id}`}>
                                                        <h3 className="font-medium text-gray-900 dark:text-white hover:underline line-clamp-1">{item.name}</h3>
                                                    </Link>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id, item.size, item.color)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" aria-label={`${t('remove')} ${item.name}`}>
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-3 mt-2">
                                                {item.color && item.color !== '-' && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-3.5 h-3.5 rounded-full border border-warm-400 dark:border-gray-600" style={{ backgroundColor: COLOR_MAP[item.color] || item.color }} />
                                                        <span className="text-xs text-gray-500">{item.color}</span>
                                                    </div>
                                                )}
                                                {item.size && item.size !== '-' && (
                                                    <span className="text-xs text-gray-500 px-2 py-0.5 border border-warm-400 dark:border-gray-700 rounded">{item.size}</span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-3">
                                                <div className="flex items-center border border-warm-400 dark:border-gray-700 rounded-lg">
                                                    <button onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)} disabled={item.quantity <= 1} className="p-2 hover:bg-warm-300 dark:hover:bg-gray-700 rounded-l-lg disabled:opacity-30 transition-colors" aria-label={t('decreaseQuantity')}>
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="px-4 text-sm font-medium min-w-[2.5rem] text-center">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)} className="p-2 hover:bg-warm-300 dark:hover:bg-gray-700 rounded-r-lg transition-colors" aria-label={t('increaseQuantity')}>
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
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
                        <div className="bg-warm-50 dark:bg-gray-800 rounded-2xl shadow-sm p-6 sticky top-24 space-y-5">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('orderSummary')}</h2>

                            {/* Coupon */}
                            <div className="space-y-2">
                                {coupon ? (
                                    <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            <span className="font-medium text-emerald-700 dark:text-emerald-400">{coupon.code}</span>
                                        </div>
                                        <button onClick={removeCoupon} className="text-emerald-600 hover:text-red-500 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponInput}
                                            onChange={(e) => setCouponInput(e.target.value)}
                                            placeholder={t('couponCode')}
                                            className="flex-1 px-3 py-2 text-sm border border-warm-400 dark:border-gray-700 rounded-xl bg-transparent focus:outline-none focus:border-accent-900 dark:focus:border-white transition-colors"
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                        />
                                        <button onClick={handleApplyCoupon} className="px-4 py-2 text-sm font-medium bg-warm-300 dark:bg-gray-700 rounded-xl hover:bg-warm-400 dark:hover:bg-gray-600 transition-colors">{t('apply')}</button>
                                    </div>
                                )}
                                {couponMsg && (
                                    <p className={`text-xs ${couponMsg.success ? 'text-emerald-600' : 'text-red-500'}`}>{couponMsg.message}</p>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="space-y-2 text-sm">
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
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>{t('tax')} (21% IVA)</span>
                                    <span>${getTax().toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between pt-3 border-t border-warm-400 dark:border-gray-700">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{t('total')}</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">${getGrandTotal().toFixed(2)}</span>
                            </div>

                            {/* Free shipping bar */}
                            {getSubtotal() < 50 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        <Truck className="w-3.5 h-3.5" />
                                        {t('freeShippingProgress', { amount: (50 - getSubtotal()).toFixed(2) })}
                                    </div>
                                    <div className="w-full h-1.5 bg-warm-400 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-accent-900 dark:bg-white rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (getSubtotal() / 50) * 100)}%` }} />
                                    </div>
                                </div>
                            )}

                            <Link
                                to="/checkout"
                                className="flex items-center justify-center gap-2 w-full py-3.5 bg-accent-900 text-white rounded-xl font-medium text-sm uppercase tracking-wider hover:bg-accent-800 transition-colors active:scale-[0.98]"
                            >
                                {t('checkout')} <ArrowRight className="w-4 h-4" />
                            </Link>

                            <Link to="/products" className="flex items-center justify-center w-full text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
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