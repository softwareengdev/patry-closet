import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch as SearchIcon,
    FiShoppingCart as ShoppingCart,
    FiUser as User,
    FiMenu as Menu,
    FiX as X,
    FiChevronDown as ChevronDown
} from "react-icons/fi";
import { Sun, Moon, Heart, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';

const Navbar = ({ toggleDarkMode, darkMode, isTransparent = false }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState({ women: false, men: false, accessories: false });
    const [miniCartOpen, setMiniCartOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [scrolled, setScrolled] = useState(false);

    const { t, i18n } = useTranslation();
    const { getItemCount, cartItems } = useContext(CartContext);
    const { wishlistItems } = useContext(WishlistContext);
    const navigate = useNavigate();

    const toggleDropdown = (category) => {
        setIsDropdownOpen(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm('');
        }
    };

    // Últimos 3 productos del carrito para mini-cart
    const lastItems = cartItems.slice(-3);

    const categories = {
        women: ['Vestidos', 'Tops', 'Pantalones', 'Zapatos'],
        men: ['Camisas', 'Jeans', 'Chaquetas', 'Accesorios'],
        accessories: ['Bolsos', 'Joyas', 'Relojes', 'Gafas'],
    };

    useEffect(() => {
        if (!isTransparent) return;
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [isTransparent]);

    const showSolid = !isTransparent || scrolled || isMobileMenuOpen;

    return (
        <nav className={`fixed w-full z-50 top-0 transition-all duration-500 ${showSolid
            ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl shadow-xl border-b border-gray-100 dark:border-gray-800'
            : 'bg-transparent border-b border-white/10'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {/* Logo Premium */}
                    <Link
                        to="/"
                        className="flex-shrink-0 group"
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className={`text-3xl font-bold tracking-tighter flex items-center gap-1 transition-colors duration-300 ${showSolid ? 'text-gray-900 dark:text-white' : 'text-white'}`}
                        >
                            PATRY
                            <span className="text-blue-600 group-hover:rotate-12 transition-transform">♡</span>
                            CLOSET
                        </motion.div>
                    </Link>

                    {/* Desktop Navigation - Ultra elegante */}
                    <div className={`hidden md:flex items-center space-x-10 text-sm font-medium transition-colors duration-300 ${showSolid ? 'text-gray-800 dark:text-gray-200' : 'text-white/90'}`}>
                        {[
                            { key: 'women', label: t('women') },
                            { key: 'men', label: t('men') },
                            { key: 'accessories', label: t('accessories') }
                        ].map(({ key, label }) => (
                            <div key={key} className="relative group">
                                <button
                                    onClick={() => toggleDropdown(key)}
                                    className="flex items-center gap-1 hover:text-blue-600 transition-colors duration-200 py-2"
                                    aria-label={label}
                                >
                                    {label}
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen[key] ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isDropdownOpen[key] && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 12, scale: 0.98 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute left-0 mt-3 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl py-3 border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
                                        >
                                            {categories[key].map(item => (
                                                <Link
                                                    key={item}
                                                    to={`/products?category=${item.toLowerCase()}`}
                                                    className="block px-6 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                                    onClick={() => setIsDropdownOpen(prev => ({ ...prev, [key]: false }))}
                                                >
                                                    {item}
                                                </Link>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}

                        <Link
                            to="/sales"
                            className="hover:text-blue-600 transition-colors duration-200 py-2 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-blue-600 after:w-0 hover:after:w-full after:transition-all"
                        >
                            {t('sales')}
                        </Link>
                    </div>

                    {/* Icons Section - Ultra premium */}
                    <div className="hidden md:flex items-center gap-7">
                        {/* Search funcional elegante */}
                        <form onSubmit={handleSearch} className="relative group">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('search')}
                                className={`bg-transparent border-b focus:border-blue-600 w-56 focus:w-72 outline-none px-3 py-2 text-sm transition-all duration-300 ${showSolid
                                    ? 'border-gray-300 dark:border-gray-700 placeholder:text-gray-400 text-gray-900 dark:text-white'
                                    : 'border-white/30 placeholder:text-white/50 text-white'
                                    }`}
                            />
                            <button type="submit" className={`absolute right-0 top-1/2 -translate-y-1/2 transition-colors ${showSolid ? 'text-gray-400 hover:text-blue-600' : 'text-white/60 hover:text-white'}`}>
                                <SearchIcon className="w-5 h-5" />
                            </button>
                        </form>

                        {/* Wishlist */}
                        <Link to="/wishlist" className="relative group">
                            <motion.div whileHover={{ scale: 1.2 }} transition={{ type: "spring", stiffness: 400 }}>
                                <Heart className={`w-6 h-6 group-hover:text-rose-500 transition-colors ${showSolid ? 'text-gray-700 dark:text-gray-300' : 'text-white/80'}`} />
                            </motion.div>
                            {wishlistItems.length > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-medium rounded-full w-5 h-5 flex items-center justify-center shadow"
                                >
                                    {wishlistItems.length}
                                </motion.span>
                            )}
                        </Link>

                        {/* Mini Cart con preview avanzado */}
                        <div
                            className="relative"
                            onMouseEnter={() => setMiniCartOpen(true)}
                            onMouseLeave={() => setMiniCartOpen(false)}
                        >
                            <Link to="/cart" className="relative group">
                                <motion.div whileHover={{ scale: 1.15 }}>
                                    <ShoppingCart className={`w-6 h-6 group-hover:text-blue-600 transition-colors ${showSolid ? 'text-gray-700 dark:text-gray-300' : 'text-white/80'}`} />
                                </motion.div>
                                {getItemCount() > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-medium rounded-full w-5 h-5 flex items-center justify-center shadow"
                                    >
                                        {getItemCount()}
                                    </motion.span>
                                )}
                            </Link>

                            <AnimatePresence>
                                {miniCartOpen && getItemCount() > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                        transition={{ duration: 0.25 }}
                                        className="absolute right-0 mt-4 w-96 bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 z-50"
                                    >
                                        <div className="p-6 border-b dark:border-gray-800">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-lg">Tu carrito • {getItemCount()} artículos</p>
                                                <p className="text-sm text-gray-500">Total: <span className="font-medium text-blue-600">${cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}</span></p>
                                            </div>
                                        </div>

                                        <div className="max-h-80 overflow-y-auto p-3">
                                            {lastItems.map((item, index) => (
                                                <div key={`${item.id}-${index}`} className="flex gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-colors">
                                                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{item.size} • {item.color}</p>
                                                        <p className="text-xs font-medium mt-1">${(item.price * item.quantity).toFixed(2)} ×{item.quantity}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                                            <Link
                                                to="/cart"
                                                onClick={() => setMiniCartOpen(false)}
                                                className="flex items-center justify-center gap-2 bg-black hover:bg-blue-600 text-white py-4 rounded-2xl font-semibold transition-all active:scale-95"
                                            >
                                                Ver carrito completo
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Profile */}
                        <Link to="/profile" className={`transition-colors ${showSolid ? 'text-gray-700 dark:text-gray-300 hover:text-blue-600' : 'text-white/80 hover:text-white'}`}>
                            <User className="w-6 h-6" />
                        </Link>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className={`transition-colors ${showSolid ? 'text-gray-700 dark:text-gray-300 hover:text-blue-600' : 'text-white/80 hover:text-white'}`}
                            aria-label={t('toggleTheme')}
                        >
                            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                        </button>

                        {/* Language */}
                        <select
                            onChange={(e) => changeLanguage(e.target.value)}
                            className={`bg-transparent text-sm border-none focus:outline-none cursor-pointer transition-colors ${showSolid ? 'text-gray-700 dark:text-gray-300' : 'text-white/80'}`}
                            aria-label={t('language')}
                        >
                            <option value="en">EN</option>
                            <option value="es">ES</option>
                        </select>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`transition-colors ${showSolid ? 'text-gray-700 dark:text-gray-300 hover:text-blue-600' : 'text-white/80 hover:text-white'}`}
                            aria-label={t('menu')}
                        >
                            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu - Mejorado */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800"
                    >
                        <div className="px-6 py-8 space-y-6 text-lg">
                            <Link to="/" className="block font-medium" onClick={() => setIsMobileMenuOpen(false)}>Inicio</Link>

                            {/* Dropdowns en mobile */}
                            {Object.keys(categories).map(key => (
                                <div key={key}>
                                    <button
                                        onClick={() => toggleDropdown(key)}
                                        className="w-full text-left flex items-center justify-between font-medium"
                                    >
                                        {t(key)}
                                        <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen[key] ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isDropdownOpen[key] && (
                                        <div className="pl-6 mt-3 space-y-3 text-base">
                                            {categories[key].map(item => (
                                                <Link
                                                    key={item}
                                                    to={`/products?category=${item.toLowerCase()}`}
                                                    className="block text-gray-600 dark:text-gray-400"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                >
                                                    {item}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            <Link to="/sales" className="block font-medium" onClick={() => setIsMobileMenuOpen(false)}>{t('sales')}</Link>
                            <Link to="/cart" className="block font-medium" onClick={() => setIsMobileMenuOpen(false)}>Carrito ({getItemCount()})</Link>
                            <Link to="/wishlist" className="block font-medium" onClick={() => setIsMobileMenuOpen(false)}>Lista de deseos ({wishlistItems.length})</Link>

                            <div className="pt-6 border-t flex flex-col gap-4">
                                <button onClick={toggleDarkMode} className="text-left flex items-center gap-3">
                                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                    {darkMode ? t('lightMode') : t('darkMode')}
                                </button>
                                <select
                                    onChange={(e) => changeLanguage(e.target.value)}
                                    className="bg-transparent text-left"
                                >
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;