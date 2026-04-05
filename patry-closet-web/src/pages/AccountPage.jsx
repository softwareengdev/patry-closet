import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    User, MapPin, Package, Heart, CreditCard, Bell, Settings,
    LogOut, Shield, Sparkles, ChevronLeft,
} from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import ProfileTab from '../components/account/ProfileTab';
import AddressesTab from '../components/account/AddressesTab';
import OrdersTab from '../components/account/OrdersTab';
import PaymentsTab from '../components/account/PaymentsTab';
import NotificationsTab from '../components/account/NotificationsTab';
import PreferencesTab from '../components/account/PreferencesTab';
import SecurityTab from '../components/account/SecurityTab';

const TAB_MAP = {
    profile: { component: ProfileTab, icon: User, color: 'text-blue-500' },
    addresses: { component: AddressesTab, icon: MapPin, color: 'text-green-500' },
    orders: { component: OrdersTab, icon: Package, color: 'text-purple-500' },
    payments: { component: PaymentsTab, icon: CreditCard, color: 'text-amber-500' },
    notifications: { component: NotificationsTab, icon: Bell, color: 'text-red-500' },
    preferences: { component: PreferencesTab, icon: Settings, color: 'text-indigo-500' },
    security: { component: SecurityTab, icon: Shield, color: 'text-gray-500' },
};

const AccountPage = () => {
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Derive active tab from URL path
    const pathParts = location.pathname.split('/').filter(Boolean);
    const urlTab = pathParts.length > 1 ? pathParts[1] : null;
    const [activeTab, setActiveTab] = useState(urlTab && TAB_MAP[urlTab] ? urlTab : null);

    useEffect(() => {
        const tab = pathParts.length > 1 ? pathParts[1] : null;
        setActiveTab(tab && TAB_MAP[tab] ? tab : null);
    }, [location.pathname]);

    const handleTabClick = (tabKey) => {
        navigate(`/account/${tabKey}`);
    };

    const handleBack = () => {
        navigate('/account');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const TABS = [
        { key: 'profile', label: t('account.profile', 'My Profile') },
        { key: 'addresses', label: t('account.addresses', 'Addresses') },
        { key: 'orders', label: t('account.orders', 'Orders') },
        { key: 'payments', label: t('account.paymentMethods', 'Payments') },
        { key: 'notifications', label: t('account.notifications', 'Notifications'), badge: 2 },
        { key: 'preferences', label: t('account.preferences', 'Preferences') },
        { key: 'security', label: t('account.security', 'Security') },
    ];

    const ActiveComponent = activeTab ? TAB_MAP[activeTab]?.component : null;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Profile Header (compact) */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-6"
            >
                {activeTab && (
                    <button onClick={handleBack} className="sm:hidden p-2 -ml-2" aria-label="Back">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                <div className={`w-12 h-12 rounded-full overflow-hidden ring-2 shrink-0 ${isDark ? 'ring-gray-800 bg-gray-800' : 'ring-warm-300 bg-warm-300'}`}>
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user?.firstName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-gray-400" /></div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="font-serif text-lg sm:text-xl font-light tracking-tight truncate">
                        {user?.firstName} {user?.lastName}
                    </h1>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-pink-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t('account.memberSince', 'Member since')} {user?.memberSince || formatDate(user?.createdAt)}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className={`hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium uppercase tracking-wider transition-colors ${
                        isDark ? 'hover:bg-red-950/20 hover:text-red-400' : 'hover:bg-red-50 hover:text-red-600'
                    }`}
                >
                    <LogOut className="w-4 h-4" />
                    {t('account.logout', 'Sign Out')}
                </button>
            </motion.div>

            <div className="flex gap-6 sm:gap-8">
                {/* ─── Sidebar (desktop) ─── */}
                <aside className={`hidden sm:block w-56 shrink-0 ${activeTab ? '' : 'sm:w-full sm:max-w-none'}`}>
                    <nav className="space-y-1 sticky top-24">
                        {TABS.map(tab => {
                            const config = TAB_MAP[tab.key];
                            const Icon = config.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => handleTabClick(tab.key)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all text-left border-l-2 ${
                                        isActive
                                            ? isDark ? 'border-white font-semibold bg-gray-800/50' : 'border-black font-semibold bg-warm-200'
                                            : 'border-transparent hover:bg-warm-200 dark:hover:bg-gray-800/50'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? config.color : 'text-gray-400'}`} />
                                    <span className="flex-1">{tab.label}</span>
                                    {tab.badge && (
                                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white">{tab.badge}</span>
                                    )}
                                </button>
                            );
                        })}

                        {/* Wishlist shortcut */}
                        <Link to="/wishlist"
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-warm-200 dark:hover:bg-gray-800/50 text-left border-l-2 border-transparent">
                            <Heart className="w-4 h-4 text-pink-500" />
                            <span>{t('account.wishlist', 'Wishlist')}</span>
                        </Link>

                        {/* Mobile logout */}
                        <button onClick={handleLogout}
                            className="sm:hidden w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-left mt-4 border-l-2 border-transparent">
                            <LogOut className="w-4 h-4" />
                            {t('account.logout', 'Sign Out')}
                        </button>
                    </nav>
                </aside>

                {/* ─── Mobile: Tab cards (when no tab selected) ─── */}
                {!activeTab && (
                    <div className="sm:hidden w-full space-y-2">
                        {TABS.map(tab => {
                            const config = TAB_MAP[tab.key];
                            const Icon = config.icon;
                            return (
                                <motion.button
                                    key={tab.key}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handleTabClick(tab.key)}
                                    className={`w-full flex items-center gap-3 p-4 border text-left transition-all ${
                                        isDark ? 'border-gray-800 hover:border-gray-700' : 'border-warm-400 hover:border-warm-500'
                                    }`}
                                >
                                    <div className={`w-9 h-9 flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-warm-300'}`}>
                                        <Icon className={`w-4 h-4 ${config.color}`} />
                                    </div>
                                    <span className="flex-1 text-sm font-medium">{tab.label}</span>
                                    {tab.badge && (
                                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white">{tab.badge}</span>
                                    )}
                                    <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
                                </motion.button>
                            );
                        })}
                        <Link to="/wishlist"
                            className={`flex items-center gap-3 p-4 border text-left ${
                                isDark ? 'border-gray-800 hover:border-gray-700' : 'border-warm-400 hover:border-warm-500'
                            }`}>
                            <div className={`w-9 h-9 flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-warm-300'}`}>
                                <Heart className="w-4 h-4 text-pink-500" />
                            </div>
                            <span className="flex-1 text-sm font-medium">{t('account.wishlist', 'Wishlist')}</span>
                            <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
                        </Link>
                        <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-4 text-sm text-red-500 mt-4">
                            <LogOut className="w-4 h-4" />
                            {t('account.logout', 'Sign Out')}
                        </button>
                    </div>
                )}

                {/* ─── Tab Content ─── */}
                {activeTab && ActiveComponent && (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 min-w-0"
                    >
                        <ActiveComponent />
                    </motion.div>
                )}

                {/* Desktop: show profile by default */}
                {!activeTab && (
                    <div className="hidden sm:block flex-1">
                        <ProfileTab />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountPage;
