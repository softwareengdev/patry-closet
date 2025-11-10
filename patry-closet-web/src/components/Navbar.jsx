import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch as Search,
    FiShoppingCart as ShoppingCart,
    FiUser as User,
    FiMenu as Menu,
    FiX as X,
    FiChevronDown as ChevronDown
} from "react-icons/fi";
import { Sun, Moon } from 'lucide-react'; // Para icons de theme
import { useTranslation } from 'react-i18next'; // Para i18n

const Navbar = ({ toggleDarkMode, darkMode }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState({ women: false, men: false, accessories: false });
    const { t, i18n } = useTranslation();

    const toggleDropdown = (category) => {
        setIsDropdownOpen(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const categories = {
        women: ['Vestidos', 'Tops', 'Pantalones', 'Zapatos'],
        men: ['Camisas', 'Jeans', 'Chaquetas', 'Accesorios'],
        accessories: ['Bolsos', 'Joyas', 'Relojes', 'Gafas'],
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-lg fixed w-full z-50 top-0 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white tracking-wider hover:text-blue-600 transition-colors">
                            Patry Closet
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <div className="relative group">
                            <button
                                onClick={() => toggleDropdown('women')}
                                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
                                aria-label={t('women')}
                            >
                                {t('women')} <ChevronDown className="ml-1 w-4 h-4" />
                            </button>
                            <AnimatePresence>
                                {isDropdownOpen.women && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-xl py-2 z-50"
                                    >
                                        {categories.women.map(item => (
                                            <Link
                                                key={item}
                                                to={`/products?category=${item.toLowerCase()}`}
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600 transition-colors"
                                                onClick={() => setIsDropdownOpen(prev => ({ ...prev, women: false }))}
                                            >
                                                {item}
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="relative group">
                            <button
                                onClick={() => toggleDropdown('men')}
                                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
                                aria-label={t('men')}
                            >
                                {t('men')} <ChevronDown className="ml-1 w-4 h-4" />
                            </button>
                            <AnimatePresence>
                                {isDropdownOpen.men && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-xl py-2 z-50"
                                    >
                                        {categories.men.map(item => (
                                            <Link
                                                key={item}
                                                to={`/products?category=${item.toLowerCase()}`}
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600 transition-colors"
                                                onClick={() => setIsDropdownOpen(prev => ({ ...prev, men: false }))}
                                            >
                                                {item}
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="relative group">
                            <button
                                onClick={() => toggleDropdown('accessories')}
                                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
                                aria-label={t('accessories')}
                            >
                                {t('accessories')} <ChevronDown className="ml-1 w-4 h-4" />
                            </button>
                            <AnimatePresence>
                                {isDropdownOpen.accessories && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-xl py-2 z-50"
                                    >
                                        {categories.accessories.map(item => (
                                            <Link
                                                key={item}
                                                to={`/products?category=${item.toLowerCase()}`}
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600 transition-colors"
                                                onClick={() => setIsDropdownOpen(prev => ({ ...prev, accessories: false }))}
                                            >
                                                {item}
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <Link to="/sales" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors" aria-label={t('sales')}>
                            {t('sales')}
                        </Link>
                    </div>

                    {/* Icons: Search, Cart, User, Theme, Language */}
                    <div className="hidden md:flex items-center space-x-4">
                        <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors" aria-label={t('search')}>
                            <Search className="w-6 h-6" />
                        </button>
                        <Link to="/cart" className="relative text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors" aria-label={t('cart')}>
                            <ShoppingCart className="w-6 h-6" />
                            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                3 {/* Placeholder; actualiza con contexto si implementado */}
                            </span>
                        </Link>
                        <Link to="/profile" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors" aria-label={t('profile')}>
                            <User className="w-6 h-6" />
                        </Link>
                        <button onClick={toggleDarkMode} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors" aria-label={t('toggleTheme')}>
                            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                        </button>
                        <select
                            onChange={(e) => changeLanguage(e.target.value)}
                            className="bg-transparent text-gray-700 dark:text-gray-300 border-none focus:outline-none"
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
                            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
                            aria-label={t('menu')}
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white dark:bg-gray-800 shadow-lg"
                    >
                        <div className="px-4 pt-2 pb-3 space-y-1">
                            <Link to="/" className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors">
                                Inicio
                            </Link>
                            <div>
                                <button
                                    onClick={() => toggleDropdown('women')}
                                    className="w-full text-left text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium flex items-center justify-between transition-colors"
                                    aria-label={t('women')}
                                >
                                    {t('women')} <ChevronDown className={`w-4 h-4 transform ${isDropdownOpen.women ? 'rotate-180' : ''}`} />
                                </button>
                                {isDropdownOpen.women && (
                                    <div className="pl-6 space-y-1">
                                        {categories.women.map(item => (
                                            <Link
                                                key={item}
                                                to={`/products?category=${item.toLowerCase()}`}
                                                className="block text-gray-600 dark:text-gray-400 hover:text-blue-600 px-3 py-1 text-sm transition-colors"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                {item}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Repite para Hombres y Accesorios */}
                            <div>
                                <button
                                    onClick={() => toggleDropdown('men')}
                                    className="w-full text-left text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium flex items-center justify-between transition-colors"
                                    aria-label={t('men')}
                                >
                                    {t('men')} <ChevronDown className={`w-4 h-4 transform ${isDropdownOpen.men ? 'rotate-180' : ''}`} />
                                </button>
                                {isDropdownOpen.men && (
                                    <div className="pl-6 space-y-1">
                                        {categories.men.map(item => (
                                            <Link
                                                key={item}
                                                to={`/products?category=${item.toLowerCase()}`}
                                                className="block text-gray-600 dark:text-gray-400 hover:text-blue-600 px-3 py-1 text-sm transition-colors"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                {item}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <button
                                    onClick={() => toggleDropdown('accessories')}
                                    className="w-full text-left text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium flex items-center justify-between transition-colors"
                                    aria-label={t('accessories')}
                                >
                                    {t('accessories')} <ChevronDown className={`w-4 h-4 transform ${isDropdownOpen.accessories ? 'rotate-180' : ''}`} />
                                </button>
                                {isDropdownOpen.accessories && (
                                    <div className="pl-6 space-y-1">
                                        {categories.accessories.map(item => (
                                            <Link
                                                key={item}
                                                to={`/products?category=${item.toLowerCase()}`}
                                                className="block text-gray-600 dark:text-gray-400 hover:text-blue-600 px-3 py-1 text-sm transition-colors"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                {item}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Link to="/sales" className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors" aria-label={t('sales')}>
                                {t('sales')}
                            </Link>
                            <Link to="/cart" className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors" aria-label={t('cart')}>
                                Carrito
                            </Link>
                            <button onClick={toggleDarkMode} className="w-full text-left text-gray-700 dark:text-gray-300 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors" aria-label={t('toggleTheme')}>
                                {darkMode ? t('lightMode') : t('darkMode')}
                            </button>
                            <select
                                onChange={(e) => changeLanguage(e.target.value)}
                                className="w-full text-left bg-transparent text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-base font-medium"
                                aria-label={t('language')}
                            >
                                <option value="en">EN</option>
                                <option value="es">ES</option>
                            </select>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;