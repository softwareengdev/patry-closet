import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch as SearchIcon,
    FiShoppingCart as ShoppingCart,
    FiUser as User,
    FiMenu as Menu,
    FiX as X,
    FiChevronDown as ChevronDown,
    FiChevronRight as ChevronRight
} from "react-icons/fi";
import { Sun, Moon, Heart, ArrowRight, Monitor, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { ThemeContext } from '../context/ThemeContext';
import SearchAutocomplete from './SearchAutocomplete';

/* ─── Mega-menu category data ─── */
const megaMenuData = {
    women: {
        sections: [
            {
                titleKey: 'megaClothing',
                links: [
                    { labelKey: 'megaDresses', to: '/products?category=vestidos' },
                    { labelKey: 'megaTops', to: '/products?category=tops' },
                    { labelKey: 'megaPants', to: '/products?category=pantalones' },
                    { labelKey: 'megaSkirts', to: '/products?category=faldas' },
                    { labelKey: 'megaCoats', to: '/products?category=abrigos' },
                ],
            },
            {
                titleKey: 'megaShoes',
                links: [
                    { labelKey: 'megaHeels', to: '/products?category=tacones' },
                    { labelKey: 'megaSneakers', to: '/products?category=zapatillas' },
                    { labelKey: 'megaBoots', to: '/products?category=botas' },
                    { labelKey: 'megaSandals', to: '/products?category=sandalias' },
                ],
            },
            {
                titleKey: 'megaTrending',
                links: [
                    { labelKey: 'megaNewArrivals', to: '/products?sort=new' },
                    { labelKey: 'megaBestSellers', to: '/products?sort=best' },
                    { labelKey: 'megaSaleItems', to: '/products?sale=true' },
                ],
            },
        ],
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
        imageTitle: 'megaWomenFeature',
        imageCta: 'shopNow',
    },
    men: {
        sections: [
            {
                titleKey: 'megaClothing',
                links: [
                    { labelKey: 'megaShirts', to: '/products?category=camisas' },
                    { labelKey: 'megaJeans', to: '/products?category=jeans' },
                    { labelKey: 'megaJackets', to: '/products?category=chaquetas' },
                    { labelKey: 'megaSuits', to: '/products?category=trajes' },
                    { labelKey: 'megaPolos', to: '/products?category=polos' },
                ],
            },
            {
                titleKey: 'megaShoes',
                links: [
                    { labelKey: 'megaSneakers', to: '/products?category=zapatillas' },
                    { labelKey: 'megaFormal', to: '/products?category=formal' },
                    { labelKey: 'megaBoots', to: '/products?category=botas' },
                ],
            },
            {
                titleKey: 'megaTrending',
                links: [
                    { labelKey: 'megaNewArrivals', to: '/products?sort=new' },
                    { labelKey: 'megaBestSellers', to: '/products?sort=best' },
                    { labelKey: 'megaSaleItems', to: '/products?sale=true' },
                ],
            },
        ],
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
        imageTitle: 'megaMenFeature',
        imageCta: 'shopNow',
    },
    accessories: {
        sections: [
            {
                titleKey: 'megaBags',
                links: [
                    { labelKey: 'megaHandbags', to: '/products?category=bolsos' },
                    { labelKey: 'megaBackpacks', to: '/products?category=mochilas' },
                    { labelKey: 'megaClutches', to: '/products?category=clutches' },
                ],
            },
            {
                titleKey: 'megaJewelry',
                links: [
                    { labelKey: 'megaNecklaces', to: '/products?category=collares' },
                    { labelKey: 'megaRings', to: '/products?category=anillos' },
                    { labelKey: 'megaEarrings', to: '/products?category=pendientes' },
                    { labelKey: 'megaWatches', to: '/products?category=relojes' },
                ],
            },
            {
                titleKey: 'megaOther',
                links: [
                    { labelKey: 'megaSunglasses', to: '/products?category=gafas' },
                    { labelKey: 'megaScarves', to: '/products?category=pañuelos' },
                    { labelKey: 'megaBelts', to: '/products?category=cinturones' },
                ],
            },
        ],
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
        imageTitle: 'megaAccessoriesFeature',
        imageCta: 'discoverMore',
    },
};

/* ─── Theme icons map ─── */
const themeIcons = {
    light: Sun,
    dark: Moon,
    auto: Monitor,
    'high-contrast': Eye,
};

const themeLabels = {
    light: 'themeLight',
    dark: 'themeDark',
    auto: 'themeAuto',
    'high-contrast': 'themeHighContrast',
};

/* ─── Navbar ─── */
const Navbar = ({ isTransparent = false }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeMega, setActiveMega] = useState(null);
    const [miniCartOpen, setMiniCartOpen] = useState(false);
    const [themePickerOpen, setThemePickerOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mobileExpanded, setMobileExpanded] = useState(null);

    const { t, i18n } = useTranslation();
    const { getItemCount, cartItems } = useContext(CartContext);
    const { wishlistItems } = useContext(WishlistContext);
    const { mode, setMode, isDark, isHighContrast } = useContext(ThemeContext);
    const navigate = useNavigate();

    const megaTimeoutRef = useRef(null);
    const themePickerRef = useRef(null);

    const changeLanguage = (lng) => i18n.changeLanguage(lng);

    const lastItems = cartItems.slice(-3);

    /* ─── Scroll detection ─── */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* ─── Close mega menu on route change ─── */
    const closeMega = useCallback(() => {
        clearTimeout(megaTimeoutRef.current);
        setActiveMega(null);
    }, []);

    /* ─── Mega menu hover handlers ─── */
    const handleMegaEnter = (key) => {
        clearTimeout(megaTimeoutRef.current);
        setActiveMega(key);
    };
    const handleMegaLeave = () => {
        megaTimeoutRef.current = setTimeout(() => setActiveMega(null), 200);
    };

    /* ─── Close theme picker on click outside ─── */
    useEffect(() => {
        if (!themePickerOpen) return;
        const handler = (e) => {
            if (themePickerRef.current && !themePickerRef.current.contains(e.target)) {
                setThemePickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [themePickerOpen]);

    const showSolid = !isTransparent || scrolled || isMobileMenuOpen || activeMega;
    const navTextClass = showSolid
        ? `${isHighContrast ? 'text-hc-fg' : 'text-gray-800 dark:text-gray-200'}`
        : 'text-white/90';
    const iconClass = showSolid
        ? `${isHighContrast ? 'text-hc-fg hover:text-hc-accent' : 'text-gray-700 dark:text-gray-300 hover:text-accent-900 dark:hover:text-white'}`
        : 'text-white/80 hover:text-white';

    const ThemeIcon = themeIcons[mode] || Sun;

    return (
        <>
            <nav
                role="navigation"
                aria-label="Main navigation"
                className={`fixed w-full z-50 top-0 transition-all duration-500 ${showSolid
                    ? `${isHighContrast ? 'bg-hc-bg border-b-2 border-hc-border' : 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl shadow-sm border-b border-gray-100 dark:border-gray-800'}`
                    : 'bg-transparent border-b border-white/10'
                }`}
            >
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
                    <div className="flex justify-between h-16 lg:h-20 items-center">

                        {/* ─── Logo ─── */}
                        <Link to="/" className="flex-shrink-0 group" onClick={closeMega}>
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                className={`text-2xl lg:text-3xl font-bold tracking-tighter flex items-center gap-0.5 transition-colors duration-300 ${showSolid ? `${isHighContrast ? 'text-hc-fg' : 'text-gray-900 dark:text-white'}` : 'text-white'}`}
                            >
                                PATRY
                                <span className={`transition-transform duration-300 group-hover:rotate-12 ${isHighContrast ? 'text-hc-accent' : 'text-rose'}`}>♡</span>
                                CLOSET
                            </motion.div>
                        </Link>

                        {/* ─── Desktop Navigation with Mega Menu triggers ─── */}
                        <div className={`hidden lg:flex items-center space-x-8 text-[13px] font-medium uppercase tracking-wider transition-colors duration-300 ${navTextClass}`}>
                            {['women', 'men', 'accessories'].map((key) => (
                                <div
                                    key={key}
                                    className="relative"
                                    onMouseEnter={() => handleMegaEnter(key)}
                                    onMouseLeave={handleMegaLeave}
                                >
                                    <Link
                                        to="/products"
                                        className={`flex items-center gap-1 py-6 transition-colors duration-200 relative ${activeMega === key ? (isHighContrast ? 'text-hc-accent' : 'text-accent-900 dark:text-white') : `hover:${isHighContrast ? 'text-hc-accent' : 'text-accent-900 dark:text-white'}`}`}
                                    >
                                        {t(key)}
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeMega === key ? 'rotate-180' : ''}`} />
                                        {/* Active indicator line */}
                                        <motion.span
                                            className={`absolute bottom-4 left-0 right-0 h-[2px] ${isHighContrast ? 'bg-hc-accent' : 'bg-accent-900 dark:bg-white'}`}
                                            initial={false}
                                            animate={{ scaleX: activeMega === key ? 1 : 0 }}
                                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                            style={{ originX: 0.5 }}
                                        />
                                    </Link>
                                </div>
                            ))}

                            <Link
                                to="/sales"
                                className={`py-6 transition-colors duration-200 ${isHighContrast ? 'text-hc-error font-bold' : 'text-red-600 dark:text-red-400 hover:text-red-700'}`}
                                onClick={closeMega}
                            >
                                {t('sales')}
                            </Link>
                        </div>

                        {/* ─── Right icons ─── */}
                        <div className="hidden lg:flex items-center gap-5">
                            {/* Search toggle */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSearchOpen(!searchOpen)}
                                className={`${iconClass} transition-colors`}
                                aria-label={t('search')}
                            >
                                <SearchIcon className="w-5 h-5" />
                            </motion.button>

                            {/* Wishlist */}
                            <Link to="/wishlist" className="relative group" onClick={closeMega}>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                    <Heart className={`w-5 h-5 group-hover:text-rose transition-colors ${iconClass}`} />
                                </motion.div>
                                {wishlistItems.length > 0 && (
                                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-1.5 bg-rose text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                        {wishlistItems.length}
                                    </motion.span>
                                )}
                            </Link>

                            {/* Mini Cart */}
                            <div className="relative" onMouseEnter={() => setMiniCartOpen(true)} onMouseLeave={() => setMiniCartOpen(false)}>
                                <Link to="/cart" className="relative group" onClick={closeMega}>
                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                        <ShoppingCart className={`w-5 h-5 transition-colors ${iconClass}`} />
                                    </motion.div>
                                    {getItemCount() > 0 && (
                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={`absolute -top-1.5 -right-1.5 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${isHighContrast ? 'bg-hc-accent text-black' : 'bg-accent-900'}`}>
                                            {getItemCount()}
                                        </motion.span>
                                    )}
                                </Link>

                                {/* Mini cart dropdown */}
                                <AnimatePresence>
                                    {miniCartOpen && getItemCount() > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                            className={`absolute right-0 mt-2 w-80 shadow-2xl overflow-hidden z-50 ${isHighContrast ? 'bg-hc-bg border-2 border-hc-border' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl'}`}
                                        >
                                            <div className="p-4 border-b dark:border-gray-800">
                                                <p className="font-medium text-sm">{t('cart')} • {getItemCount()}</p>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto">
                                                {lastItems.map((item, index) => (
                                                    <div key={`${item.id}-${index}`} className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-xs truncate">{item.name}</p>
                                                            <p className="text-[11px] text-gray-500 mt-0.5">{item.size} • {item.color}</p>
                                                            <p className="text-xs font-medium mt-0.5">${(item.price * item.quantity).toFixed(2)} ×{item.quantity}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-3 border-t dark:border-gray-800">
                                                <Link
                                                    to="/cart"
                                                    onClick={() => setMiniCartOpen(false)}
                                                    className={`flex items-center justify-center gap-2 py-3 text-xs font-medium uppercase tracking-wider transition-all active:scale-[0.98] ${isHighContrast ? 'bg-hc-accent text-black' : 'bg-accent-900 hover:bg-accent-800 text-white rounded-lg'}`}
                                                >
                                                    {t('viewCart')}
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Profile */}
                            <Link to="/profile" className={iconClass} onClick={closeMega}>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                    <User className="w-5 h-5" />
                                </motion.div>
                            </Link>

                            {/* ─── Theme Picker ─── */}
                            <div className="relative" ref={themePickerRef}>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setThemePickerOpen(!themePickerOpen)}
                                    className={`${iconClass} transition-colors`}
                                    aria-label={t('toggleTheme')}
                                >
                                    <ThemeIcon className="w-5 h-5" />
                                </motion.button>

                                <AnimatePresence>
                                    {themePickerOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                            className={`absolute right-0 mt-3 w-48 overflow-hidden z-50 ${isHighContrast ? 'bg-hc-bg border-2 border-hc-border' : 'bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 rounded-xl'}`}
                                        >
                                            <div className="p-1.5">
                                                {Object.entries(themeIcons).map(([key, Icon]) => (
                                                    <motion.button
                                                        key={key}
                                                        whileHover={{ x: 2 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => { setMode(key); setThemePickerOpen(false); }}
                                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-lg ${mode === key
                                                            ? (isHighContrast ? 'bg-hc-accent text-black font-bold' : 'bg-gray-100 dark:bg-gray-800 font-medium')
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                        }`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        {t(themeLabels[key])}
                                                        {mode === key && <span className="ml-auto text-xs">✓</span>}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Language */}
                            <select
                                onChange={(e) => changeLanguage(e.target.value)}
                                value={i18n.language?.substring(0, 2) || 'en'}
                                className={`bg-transparent text-[11px] uppercase tracking-wider border-none focus:outline-none cursor-pointer transition-colors font-medium ${showSolid ? (isHighContrast ? 'text-hc-fg' : 'text-gray-600 dark:text-gray-400') : 'text-white/70'}`}
                                aria-label={t('language')}
                            >
                                <option value="en">EN</option>
                                <option value="es">ES</option>
                            </select>
                        </div>

                        {/* ─── Mobile icons ─── */}
                        <div className="lg:hidden flex items-center gap-4">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSearchOpen(!searchOpen)} className={iconClass}>
                                <SearchIcon className="w-5 h-5" />
                            </motion.button>
                            <Link to="/cart" className={`relative ${iconClass}`}>
                                <ShoppingCart className="w-5 h-5" />
                                {getItemCount() > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-accent-900 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{getItemCount()}</span>
                                )}
                            </Link>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className={iconClass}
                                aria-label={t('menu')}
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* ─── Smart Search Autocomplete ─── */}
                <AnimatePresence>
                    {searchOpen && (
                        <SearchAutocomplete isOpen={searchOpen} onClose={() => setSearchOpen(false)} isHighContrast={isHighContrast} />
                    )}
                </AnimatePresence>

                {/* ─── MEGA MENU DESKTOP ─── */}
                <AnimatePresence>
                    {activeMega && megaMenuData[activeMega] && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className={`hidden lg:block overflow-hidden border-t ${isHighContrast ? 'border-hc-border bg-hc-bg' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950'}`}
                            onMouseEnter={() => handleMegaEnter(activeMega)}
                            onMouseLeave={handleMegaLeave}
                        >
                            <div className="max-w-[1440px] mx-auto px-10 py-10">
                                <div className="grid grid-cols-12 gap-8">
                                    {/* Category columns */}
                                    <div className="col-span-8 grid grid-cols-3 gap-8">
                                        {megaMenuData[activeMega].sections.map((section, sIdx) => (
                                            <motion.div
                                                key={section.titleKey}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: sIdx * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                            >
                                                <h4 className={`text-[11px] font-semibold uppercase tracking-ultra-wide mb-5 ${isHighContrast ? 'text-hc-accent' : 'text-gray-400'}`}>
                                                    {t(section.titleKey)}
                                                </h4>
                                                <ul className="space-y-3">
                                                    {section.links.map((link) => (
                                                        <li key={link.labelKey}>
                                                            <Link
                                                                to={link.to}
                                                                onClick={closeMega}
                                                                className={`group flex items-center text-sm transition-colors duration-200 ${isHighContrast ? 'text-hc-fg hover:text-hc-link' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                                            >
                                                                <span>{t(link.labelKey)}</span>
                                                                <ChevronRight className="w-3.5 h-3.5 ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Featured image */}
                                    <motion.div
                                        className="col-span-4 relative overflow-hidden rounded-lg group cursor-pointer"
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <Link to="/products" onClick={closeMega} className="block relative aspect-[4/3] overflow-hidden rounded-lg">
                                            <img
                                                src={megaMenuData[activeMega].image}
                                                alt=""
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                                <p className="text-white text-lg font-serif font-light mb-2">
                                                    {t(megaMenuData[activeMega].imageTitle)}
                                                </p>
                                                <span className="inline-flex items-center gap-1.5 text-white/90 text-xs font-medium uppercase tracking-wider group-hover:gap-2.5 transition-all">
                                                    {t(megaMenuData[activeMega].imageCta)}
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </span>
                                            </div>
                                        </Link>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── MOBILE MENU ─── */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className={`lg:hidden overflow-hidden border-t ${isHighContrast ? 'border-hc-border bg-hc-bg' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950'}`}
                        >
                            <div className="px-6 py-6 space-y-1 max-h-[80vh] overflow-y-auto">
                                <Link to="/" className="block py-3 text-base font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                    {t('home') || 'Home'}
                                </Link>

                                {/* Category accordions */}
                                {Object.entries(megaMenuData).map(([key, data]) => (
                                    <div key={key} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                        <button
                                            onClick={() => setMobileExpanded(mobileExpanded === key ? null : key)}
                                            className="w-full flex items-center justify-between py-3 text-base font-medium"
                                        >
                                            {t(key)}
                                            <motion.span animate={{ rotate: mobileExpanded === key ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                <ChevronDown className="w-4 h-4" />
                                            </motion.span>
                                        </button>
                                        <AnimatePresence>
                                            {mobileExpanded === key && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pb-4 space-y-4">
                                                        {/* Category image */}
                                                        <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className="block relative aspect-[16/7] rounded-lg overflow-hidden">
                                                            <img src={data.image} alt="" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/30 flex items-end p-4">
                                                                <span className="text-white text-sm font-medium">{t(data.imageCta)} →</span>
                                                            </div>
                                                        </Link>
                                                        {data.sections.map((section) => (
                                                            <div key={section.titleKey}>
                                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-2">{t(section.titleKey)}</p>
                                                                {section.links.map((link) => (
                                                                    <Link
                                                                        key={link.labelKey}
                                                                        to={link.to}
                                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                                        className="block px-2 py-2 text-sm text-gray-600 dark:text-gray-400"
                                                                    >
                                                                        {t(link.labelKey)}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}

                                <Link to="/sales" className="block py-3 text-base font-medium text-red-600" onClick={() => setIsMobileMenuOpen(false)}>
                                    {t('sales')}
                                </Link>

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                                    <Link to="/wishlist" className="flex items-center gap-3 py-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Heart className="w-4 h-4" /> {t('wishlist')} ({wishlistItems.length})
                                    </Link>

                                    {/* Theme selector mobile */}
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">{t('toggleTheme')}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(themeIcons).map(([key, Icon]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setMode(key)}
                                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${mode === key
                                                        ? (isHighContrast ? 'bg-hc-accent text-black font-bold' : 'bg-gray-100 dark:bg-gray-800 font-medium')
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {t(themeLabels[key])}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Language */}
                                    <div className="flex gap-2 pt-2">
                                        {[['en', 'English'], ['es', 'Español']].map(([code, label]) => (
                                            <button
                                                key={code}
                                                onClick={() => changeLanguage(code)}
                                                className={`px-3 py-2 text-sm rounded-lg transition-colors ${i18n.language?.startsWith(code) ? 'bg-gray-100 dark:bg-gray-800 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Backdrop for mega menu */}
            <AnimatePresence>
                {activeMega && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={closeMega}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;