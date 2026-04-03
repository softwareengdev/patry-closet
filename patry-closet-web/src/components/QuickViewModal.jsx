// src/components/QuickViewModal.jsx
import { useState, useContext, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingCart, Star, ChevronLeft, ChevronRight, Truck, RotateCcw, Shield } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { useTranslation } from 'react-i18next';
import { COLOR_MAP } from '../data/products';

const QuickViewModal = ({ product, isOpen, onClose }) => {
    const { t } = useTranslation();
    const { addToCart } = useContext(CartContext);
    const { toggleWishlist, isInWishlist } = useContext(WishlistContext);

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addedSuccess, setAddedSuccess] = useState(false);

    const productImages = product ? (
        product.images && product.images.length > 0 ? product.images : [
            product.image,
            product.hoverImage,
        ].filter(Boolean)
    ) : [];

    const availableColors = product?.colors || ['Negro', 'Blanco', 'Gris', 'Beige'];
    const availableSizes = product?.sizes || ['XS', 'S', 'M', 'L', 'XL'];

    useEffect(() => {
        if (product && isOpen) {
            setSelectedSize(product.size || availableSizes[0]);
            setSelectedColor(product.color || availableColors[0]);
            setSelectedImage(0);
            setQuantity(1);
            setAddedSuccess(false);
        }
    }, [product, isOpen]);

    const handleAddToCart = useCallback(() => {
        if (!product) return;
        addToCart(product, selectedSize, selectedColor);
        setAddedSuccess(true);
        setTimeout(() => setAddedSuccess(false), 2000);
    }, [product, selectedSize, selectedColor, addToCart]);

    const navigateImage = useCallback((dir) => {
        setSelectedImage(prev => {
            if (dir === 'next') return prev < productImages.length - 1 ? prev + 1 : 0;
            return prev > 0 ? prev - 1 : productImages.length - 1;
        });
    }, [productImages.length]);

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!product) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="relative bg-warm-50 dark:bg-gray-950 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center bg-warm-50/80 dark:bg-gray-900/80 backdrop-blur-md hover:bg-warm-200 dark:hover:bg-gray-800 transition-colors"
                            aria-label={t('close')}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            {/* Gallery */}
                            <div className="relative bg-warm-100 dark:bg-gray-900 aspect-[3/4] lg:aspect-auto lg:min-h-[600px] overflow-hidden group">
                                <TransformWrapper initialScale={1} minScale={0.8} maxScale={4} wheel={{ disabled: false }}>
                                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
                                        <motion.img
                                            key={selectedImage}
                                            src={productImages[selectedImage]}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </TransformComponent>
                                </TransformWrapper>

                                {/* Nav arrows */}
                                <button
                                    onClick={() => navigateImage('prev')}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/80 dark:bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => navigateImage('next')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/80 dark:bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black"
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>

                                {/* Thumbnails strip */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {productImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`w-12 h-12 overflow-hidden border transition-all ${
                                                selectedImage === idx
                                                    ? 'border-black dark:border-white opacity-100'
                                                    : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>

                                {/* Badge */}
                                {product.badge && (
                                    <span className={`absolute top-4 left-4 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white ${
                                        product.badge === 'new' ? 'bg-black' : 'bg-rose-600'
                                    }`}>
                                        {product.badge === 'new' ? t('badgeNew') : t('badgeBestSeller')}
                                    </span>
                                )}
                            </div>

                            {/* Details */}
                            <div className="p-6 sm:p-8 lg:p-10 flex flex-col">
                                {/* Brand + Title */}
                                <p className="text-[11px] font-medium uppercase tracking-ultra-wide text-gray-400 dark:text-gray-500 mb-2">
                                    {product.brand || product.category}
                                </p>
                                <div className="flex items-start justify-between gap-4">
                                    <h2 className="font-serif text-2xl sm:text-3xl font-light tracking-tight text-gray-900 dark:text-white leading-tight">
                                        {product.name}
                                    </h2>
                                    <button
                                        onClick={() => toggleWishlist(product)}
                                        className="shrink-0 w-10 h-10 flex items-center justify-center hover:bg-warm-200 dark:hover:bg-gray-800 transition-colors"
                                        aria-label={isInWishlist(product.id) ? t('removeFromWishlist') : t('addToWishlist')}
                                    >
                                        <Heart className={`w-5 h-5 transition-colors ${isInWishlist(product.id) ? 'fill-rose-500 text-rose-500' : 'text-gray-400 hover:text-gray-600'}`} />
                                    </button>
                                </div>

                                {/* Price */}
                                <div className="flex items-baseline gap-3 mt-3">
                                    <span className={`text-xl font-light tracking-tight ${product.discount > 0 ? 'text-rose-600' : 'text-gray-900 dark:text-white'}`}>
                                        ${product.price.toFixed(2)}
                                    </span>
                                    {product.originalPrice && (
                                        <span className="text-sm text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
                                    )}
                                    {product.discount > 0 && (
                                        <span className="text-[10px] font-medium uppercase tracking-wider text-rose-600 border border-rose-200 dark:border-rose-800 px-2 py-0.5">
                                            -{product.discount}%
                                        </span>
                                    )}
                                </div>

                                {/* Rating */}
                                <div className="flex items-center gap-1.5 mt-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-current" />
                                    ))}
                                    <span className="text-xs text-gray-400 ml-1">(128)</span>
                                </div>

                                {/* Divider */}
                                <div className="w-full h-px bg-warm-300 dark:bg-gray-800 my-5" />

                                {/* Description */}
                                <p className="text-sm font-light text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {product.name} — {t('descriptionText', { category: product.category?.toLowerCase() })}.
                                </p>

                                {/* Color selection */}
                                <div className="mt-6">
                                    <p className="text-[11px] font-medium uppercase tracking-ultra-wide text-gray-400 dark:text-gray-500 mb-3">
                                        {t('color')}: <span className="text-gray-900 dark:text-white">{selectedColor}</span>
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        {availableColors.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setSelectedColor(color)}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                    selectedColor === color
                                                        ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-gray-900/20 dark:ring-white/20 ring-offset-warm-50 dark:ring-offset-gray-950'
                                                        : 'border-warm-300 dark:border-gray-700 hover:border-gray-400'
                                                }`}
                                                style={{ backgroundColor: COLOR_MAP?.[color] || color.toLowerCase() }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Size selection */}
                                <div className="mt-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[11px] font-medium uppercase tracking-ultra-wide text-gray-400 dark:text-gray-500">
                                            {t('size')}: <span className="text-gray-900 dark:text-white">{selectedSize}</span>
                                        </p>
                                        <button className="text-[11px] font-medium uppercase tracking-wider text-gray-500 hover:text-gray-900 dark:hover:text-white underline underline-offset-2 transition-colors">
                                            {t('sizeGuide', 'Size Guide')}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {availableSizes.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`min-w-[44px] h-10 px-3 text-sm font-light tracking-wide border transition-all ${
                                                    selectedSize === size
                                                        ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black'
                                                        : 'border-warm-400 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-white'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quantity + Add to Cart */}
                                <div className="mt-auto pt-6">
                                    <div className="flex items-stretch gap-3">
                                        {/* Qty */}
                                        <div className="flex items-center border border-warm-400 dark:border-gray-700">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="w-10 h-full flex items-center justify-center text-lg hover:bg-warm-200 dark:hover:bg-gray-800 transition-colors"
                                                aria-label="Decrease quantity"
                                            >−</button>
                                            <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="w-10 h-full flex items-center justify-center text-lg hover:bg-warm-200 dark:hover:bg-gray-800 transition-colors"
                                                aria-label="Increase quantity"
                                            >+</button>
                                        </div>

                                        {/* Add to cart */}
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleAddToCart}
                                            className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm font-medium uppercase tracking-wider transition-all ${
                                                addedSuccess
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100'
                                            }`}
                                        >
                                            {addedSuccess ? (
                                                <>✓ {t('addedToCart')}</>
                                            ) : (
                                                <><ShoppingCart className="w-4 h-4" /> {t('addToCart')}</>
                                            )}
                                        </motion.button>
                                    </div>

                                    {/* Trust badges */}
                                    <div className="flex items-center justify-center gap-6 mt-5 pt-5 border-t border-warm-300 dark:border-gray-800">
                                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-400">
                                            <Truck className="w-3.5 h-3.5" /> {t('freeShipping', 'Free Shipping')}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-400">
                                            <RotateCcw className="w-3.5 h-3.5" /> {t('easyReturns', '30-Day Returns')}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-400">
                                            <Shield className="w-3.5 h-3.5" /> {t('securePayment', 'Secure')}
                                        </span>
                                    </div>
                                </div>

                                {/* View full details link */}
                                <Link
                                    to={`/products/${product.id}`}
                                    onClick={onClose}
                                    className="block mt-4 text-center text-[11px] font-medium uppercase tracking-ultra-wide text-gray-500 hover:text-gray-900 dark:hover:text-white underline underline-offset-4 transition-colors"
                                >
                                    {t('viewFullDetails', 'View Full Details')}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QuickViewModal;