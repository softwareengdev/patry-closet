import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Package, ChevronDown, ChevronUp, ExternalLink, Truck, CheckCircle, Clock, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import authService from '../../lib/authService';

const STATUS_CONFIG = {
    pending: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, label: 'Pending' },
    processing: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Loader2, label: 'Processing' },
    shipped: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Truck, label: 'Shipped' },
    delivered: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Delivered' },
    cancelled: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Cancelled' },
    returned: { color: 'bg-warm-300 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: RotateCcw, label: 'Returned' },
};

const OrdersTab = () => {
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const data = await authService.getOrders();
                setOrders(data);
            } catch { /* ignore */ }
            setLoading(false);
        };
        loadOrders();
    }, []);

    const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formatCurrency = (n) => `$${n.toFixed(2)}`;

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`rounded-xl p-5 animate-pulse ${isDark ? 'bg-gray-800' : 'bg-warm-300'}`}>
                        <div className="flex gap-4">
                            <div className={`w-16 h-16 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-warm-400'}`} />
                            <div className="flex-1 space-y-2">
                                <div className={`h-4 w-32 rounded ${isDark ? 'bg-gray-700' : 'bg-warm-400'}`} />
                                <div className={`h-3 w-48 rounded ${isDark ? 'bg-gray-700' : 'bg-warm-400'}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            <h2 className="text-xl font-bold mb-1">{t('account.orders', 'My Orders')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('account.ordersDesc', 'Track and manage your orders')}</p>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                            filter === f
                                ? 'bg-black dark:bg-white text-white dark:text-black'
                                : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-warm-300 text-gray-600 hover:bg-warm-400'
                        }`}>
                        {f === 'all' ? t('account.allOrders', 'All') : STATUS_CONFIG[f]?.label || f}
                    </button>
                ))}
            </div>

            {/* Orders list */}
            <div className="space-y-4">
                <AnimatePresence>
                    {filteredOrders.map(order => {
                        const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                        const StatusIcon = status.icon;
                        const isExpanded = expandedOrder === order.id;

                        return (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`rounded-xl border overflow-hidden ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-warm-400 bg-warm-50'}`}
                            >
                                {/* Header */}
                                <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                    className="w-full p-4 sm:p-5 flex items-center gap-4 text-left hover:bg-warm-200/50 dark:hover:bg-gray-800/50 transition-colors">
                                    {/* First item image */}
                                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-warm-300 dark:bg-gray-800">
                                        <img src={order.items[0]?.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-sm">{order.orderNumber}</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>
                                                <StatusIcon className="w-3 h-3" /> {status.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(order.createdAt)} · {order.items.length} {order.items.length === 1 ? 'item' : 'items'} · {formatCurrency(order.total)}
                                        </p>
                                    </div>
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                                </button>

                                {/* Expanded details */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className={`px-5 pb-5 border-t ${isDark ? 'border-gray-800' : 'border-warm-300'}`}>
                                                {/* Tracking */}
                                                {order.trackingNumber && (
                                                    <div className={`mt-4 p-3 rounded-lg flex items-center justify-between ${isDark ? 'bg-gray-800' : 'bg-warm-200'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <Truck className="w-4 h-4 text-purple-500" />
                                                            <span className="text-xs font-medium">{t('account.tracking', 'Tracking')}: {order.trackingNumber}</span>
                                                        </div>
                                                        <a href={order.trackingUrl || '#'} target="_blank" rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                                                            {t('account.trackPackage', 'Track')} <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                )}

                                                {/* Items */}
                                                <div className="mt-4 space-y-3">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-warm-300 dark:bg-gray-800 shrink-0">
                                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{item.name}</p>
                                                                <p className="text-xs text-gray-500">{item.size} · {item.color} · x{item.quantity}</p>
                                                            </div>
                                                            <span className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Totals */}
                                                <div className={`mt-4 pt-3 border-t space-y-1 ${isDark ? 'border-gray-800' : 'border-warm-300'}`}>
                                                    <div className="flex justify-between text-xs text-gray-500"><span>{t('subtotal', 'Subtotal')}</span><span>{formatCurrency(order.subtotal)}</span></div>
                                                    {order.discount > 0 && <div className="flex justify-between text-xs text-green-600"><span>{t('discount', 'Discount')}</span><span>-{formatCurrency(order.discount)}</span></div>}
                                                    <div className="flex justify-between text-xs text-gray-500"><span>{t('shipping', 'Shipping')}</span><span>{order.shipping === 0 ? t('freeShipping', 'Free') : formatCurrency(order.shipping)}</span></div>
                                                    <div className="flex justify-between text-xs text-gray-500"><span>{t('tax', 'Tax')}</span><span>{formatCurrency(order.tax)}</span></div>
                                                    <div className="flex justify-between text-sm font-bold pt-1"><span>{t('total', 'Total')}</span><span>{formatCurrency(order.total)}</span></div>
                                                </div>

                                                {/* Delivery estimate */}
                                                {order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                    <p className="text-xs text-gray-500 mt-3">
                                                        {t('account.estimatedDelivery', 'Estimated delivery')}: <strong>{formatDate(order.estimatedDelivery)}</strong>
                                                    </p>
                                                )}

                                                {/* Payment info */}
                                                <div className={`mt-3 pt-3 border-t flex items-center gap-2 text-xs text-gray-500 ${isDark ? 'border-gray-800' : 'border-warm-300'}`}>
                                                    <span className="capitalize">{order.paymentMethod?.brand}</span>
                                                    <span>•••• {order.paymentMethod?.last4}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {filteredOrders.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('account.noOrders', 'No orders found')}</p>
                </div>
            )}
        </div>
    );
};

export default OrdersTab;
