import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Bell, Check, CheckCheck, Package, Tag, TrendingDown, AlertCircle, Settings } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import authService from '../../lib/authService';

const TYPE_CONFIG = {
    order: { icon: Package, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    stock: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    promo: { icon: Tag, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30' },
    price_drop: { icon: TrendingDown, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    system: { icon: Settings, color: 'text-gray-500', bg: 'bg-warm-300 dark:bg-gray-800' },
};

const NotificationsTab = () => {
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const { user, updatePreferences } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPrefs, setShowPrefs] = useState(false);
    const [prefs, setPrefs] = useState(user?.preferences?.notifications || {});

    useEffect(() => {
        const load = async () => {
            try {
                const data = await authService.getNotifications();
                setNotifications(data);
            } catch { /* ignore */ }
            setLoading(false);
        };
        load();
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markRead = async (id) => {
        await authService.markNotificationRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllRead = async () => {
        await authService.markAllNotificationsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const togglePref = async (key) => {
        const updated = { ...prefs, [key]: !prefs[key] };
        setPrefs(updated);
        await updatePreferences({ notifications: updated });
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        const days = Math.floor(hrs / 24);
        return `${days}d`;
    };

    const PREF_ITEMS = [
        { key: 'orderUpdates', label: t('account.notifOrders', 'Order Updates'), desc: t('account.notifOrdersDesc', 'Shipping, delivery and return updates') },
        { key: 'promotions', label: t('account.notifPromos', 'Promotions'), desc: t('account.notifPromosDesc', 'Sales, special offers and exclusive deals') },
        { key: 'stockAlerts', label: t('account.notifStock', 'Stock Alerts'), desc: t('account.notifStockDesc', 'When wishlist items are back in stock') },
        { key: 'newArrivals', label: t('account.notifNew', 'New Arrivals'), desc: t('account.notifNewDesc', 'New products in your favorite categories') },
        { key: 'priceDrops', label: t('account.notifPrice', 'Price Drops'), desc: t('account.notifPriceDesc', 'When items you like drop in price') },
    ];

    return (
        <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="font-serif text-xl font-light tracking-tight mb-1">{t('account.notifications', 'Notifications')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {unreadCount > 0 ? `${unreadCount} ${t('account.unread', 'unread')}` : t('account.allRead', 'All caught up!')}
                    </p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            <CheckCheck className="w-4 h-4" /> {t('account.markAllRead', 'Mark all read')}
                        </button>
                    )}
                    <button onClick={() => setShowPrefs(!showPrefs)}
                        className={`p-2 transition-colors ${showPrefs ? 'bg-black dark:bg-white text-white dark:text-black' : isDark ? 'bg-gray-800' : 'bg-warm-300'}`}>
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Notification Preferences */}
            <AnimatePresence>
                {showPrefs && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden"
                    >
                        <div className={`p-5 border ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-warm-400 bg-warm-200'}`}>
                            <h3 className="font-semibold text-sm mb-4">{t('account.notifPreferences', 'Notification Preferences')}</h3>
                            <div className="space-y-3">
                                {PREF_ITEMS.map(item => (
                                    <div key={item.key} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">{item.label}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                                        </div>
                                        <button onClick={() => togglePref(item.key)}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${prefs[item.key] ? 'bg-black dark:bg-white' : isDark ? 'bg-gray-700' : 'bg-gray-300'}`}
                                            role="switch" aria-checked={prefs[item.key]}>
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform bg-warm-50 dark:bg-black ${prefs[item.key] ? 'translate-x-5' : ''}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-warm-400 dark:border-gray-800 flex gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={prefs.pushEnabled} onChange={() => togglePref('pushEnabled')} className="w-4 h-4 accent-black dark:accent-white" />
                                    {t('account.pushNotif', 'Push notifications')}
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={prefs.emailEnabled} onChange={() => togglePref('emailEnabled')} className="w-4 h-4 accent-black dark:accent-white" />
                                    {t('account.emailNotif', 'Email notifications')}
                                </label>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notifications List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-16 animate-pulse ${isDark ? 'bg-gray-800' : 'bg-warm-300'}`} />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence>
                        {notifications.map(notif => {
                            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                            const Icon = config.icon;
                            return (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex items-start gap-3 p-4 transition-colors cursor-pointer ${
                                        !notif.read
                                            ? isDark ? 'bg-gray-800/80' : 'bg-blue-50/50'
                                            : 'hover:bg-warm-200 dark:hover:bg-gray-800/50'
                                    }`}
                                    onClick={() => markRead(notif.id)}
                                >
                                    <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${config.bg}`}>
                                        {notif.image ? (
                                            <img src={notif.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Icon className={`w-5 h-5 ${config.color}`} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm ${!notif.read ? 'font-semibold' : 'font-medium'}`}>{notif.title}</p>
                                            {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{notif.message}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(notif.createdAt)}</span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {notifications.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('account.noNotifications', 'No notifications yet')}</p>
                </div>
            )}
        </div>
    );
};

export default NotificationsTab;
