import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    User, MapPin, Package, Heart, CreditCard, Bell, Settings,
    LogOut, ChevronRight, Shield, Sparkles, Camera,
} from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const AccountPage = () => {
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const { user, logout, logoutAllDevices } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleLogoutAll = async () => {
        await logoutAllDevices();
        navigate('/');
    };

    const MENU_ITEMS = [
        { icon: User, label: t('account.profile', 'My Profile'), desc: t('account.profileDesc', 'Edit your personal information'), to: '/account/profile', color: 'text-blue-500' },
        { icon: MapPin, label: t('account.addresses', 'My Addresses'), desc: t('account.addressesDesc', 'Manage shipping addresses'), to: '/account/addresses', color: 'text-green-500' },
        { icon: Package, label: t('account.orders', 'My Orders'), desc: t('account.ordersDesc', 'Track and manage your orders'), to: '/account/orders', color: 'text-purple-500' },
        { icon: Heart, label: t('account.wishlist', 'My Wishlist'), desc: t('account.wishlistDesc', 'Items you saved for later'), to: '/wishlist', color: 'text-pink-500' },
        { icon: CreditCard, label: t('account.paymentMethods', 'Payment Methods'), desc: t('account.paymentDesc', 'Manage your saved cards'), to: '/account/payments', color: 'text-amber-500' },
        { icon: Bell, label: t('account.notifications', 'Notifications'), desc: t('account.notificationsDesc', 'Manage your notification preferences'), to: '/account/notifications', color: 'text-red-500', badge: 2 },
        { icon: Settings, label: t('account.preferences', 'Style Preferences'), desc: t('account.preferencesDesc', 'Personalize your fashion experience'), to: '/account/preferences', color: 'text-indigo-500' },
        { icon: Shield, label: t('account.security', 'Security & Sessions'), desc: t('account.securityDesc', '2FA, password, active sessions'), to: '/account/security', color: 'text-gray-500' },
    ];

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-6 sm:p-8 mb-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
            >
                <div className="flex items-center gap-5">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-800">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-10 h-10 text-gray-400" />
                                </div>
                            )}
                        </div>
                        <button
                            className="absolute bottom-0 right-0 w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            aria-label="Change profile photo"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold truncate">
                            {user?.firstName} {user?.lastName}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <Sparkles className="w-4 h-4 text-pink-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {t('account.memberSince', 'Member since')} {user?.memberSince || formatDate(user?.createdAt)}
                            </span>
                        </div>
                        {!user?.emailVerified && (
                            <Link
                                to="/account/verify-email"
                                className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400 hover:underline"
                            >
                                <Bell className="w-3 h-3" />
                                {t('account.verifyEmail', 'Verify your email')}
                            </Link>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Menu Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
                {MENU_ITEMS.map((item, i) => (
                    <motion.div
                        key={item.to}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Link
                            to={item.to}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
                                isDark
                                    ? 'border-gray-800 hover:border-gray-700 bg-gray-900/50 hover:bg-gray-900'
                                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <item.icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{item.label}</span>
                                    {item.badge && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.desc}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" />
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Logout Section */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleLogout}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                        isDark
                            ? 'border-gray-700 hover:border-red-800 hover:text-red-400 hover:bg-red-950/20'
                            : 'border-gray-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50'
                    }`}
                >
                    <LogOut className="w-4 h-4" />
                    {t('account.logout', 'Sign Out')}
                </motion.button>
                <button
                    onClick={handleLogoutAll}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                    {t('account.logoutAll', 'Sign out from all devices')}
                </button>
            </div>
        </div>
    );
};

export default AccountPage;
