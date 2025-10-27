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
 // Instala react-icons: npm install react-icons

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState({ women: false, men: false, accessories: false });

    const toggleDropdown = (category) => {
        setIsDropdownOpen(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const categories = {
        women: ['Vestidos', 'Tops', 'Pantalones', 'Zapatos'],
        men: ['Camisas', 'Jeans', 'Chaquetas', 'Accesorios'],
        accessories: ['Bolsos', 'Joyas', 'Relojes', 'Gafas'],
    };

    return (
        <nav className="bg-white shadow-lg fixed w-full z-50 top-0 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-2xl font-bold text-gray-900 tracking-wider hover:text-blue-600 transition-colors">
                            Patry Closet
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <div className="relative group">
                            <button
                                onClick={() => toggleDropdown('women')}
                                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
                            >
                                Mujeres <ChevronDown className="ml-1 w-4 h-4" />
                            </button>
                            <AnimatePresence>
                                {isDropdownOpen.women && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-xl py-2 z-50"
                                    >
                                        {categories.women.map(item => (
                                            <Link
                                                key={item}
                                                to={`/products?category=${item.toLowerCase()}`}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
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
                                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
                            >
                                Hombres <ChevronDown className="ml-1 w-4 h-4" />
                            </button>
                            <AnimatePresence>
                                {isDropdownOpen.men && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-xl py-2 z-50"
                                    >
                                        {categories.men.map(item => (
                                            <Link
                                                key={item}
                                                to={`/products?category=${item.toLowerCase()}`}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
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
                                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
                            >
                                Accesorios <ChevronDown className="ml-1 w-4 h-4" />
                            </button>
                            <AnimatePresence>
                                {isDropdownOpen.accessories && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-xl py-2 z-50"
                                    >
                                        {categories.accessories.map(item => (
                                            <Link
                                                key={item}
                                                to={`/products?category=${item.toLowerCase()}`}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                onClick={() => setIsDropdownOpen(prev => ({ ...prev, accessories: false }))}
                                            >
                                                {item}
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <Link to="/sales" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            Ofertas
                        </Link>
                    </div>

                    {/* Icons: Search, Cart, User */}
                    <div className="hidden md:flex items-center space-x-4">
                        <button className="text-gray-700 hover:text-blue-600 transition-colors">
                            <Search className="w-6 h-6" />
                        </button>
                        <Link to="/cart" className="relative text-gray-700 hover:text-blue-600 transition-colors">
                            <ShoppingCart className="w-6 h-6" />
                            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                3 {/* Placeholder para items en carrito */}
                            </span>
                        </Link>
                        <Link to="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">
                            <User className="w-6 h-6" />
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-700 hover:text-blue-600 transition-colors"
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
                        className="md:hidden bg-white shadow-lg"
                    >
                        <div className="px-4 pt-2 pb-3 space-y-1">
                            <Link to="/" className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors">
                                Inicio
                            </Link>
                            <div>
                                <button
                                    onClick={() => toggleDropdown('women')}
                                    className="w-full text-left text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium flex items-center justify-between transition-colors"
                                >
                                    Mujeres <ChevronDown className={`w-4 h-4 transform ${isDropdownOpen.women ? 'rotate-180' : ''}`} />
                                </button>
                                {isDropdownOpen.women && (
                                    <div className="pl-6 space-y-1">
                                        {categories.women.map(item => (
                                            <Link
                                                key={item}
                                                to={`/products?category=${item.toLowerCase()}`}
                                                className="block text-gray-600 hover:text-blue-600 px-3 py-1 text-sm transition-colors"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                {item}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Repite para Hombres y Accesorios de manera similar */}
                            <Link to="/cart" className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors">
                                Carrito
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;