// src/components/QuickViewModal.jsx
import { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingCart, Star } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { useTranslation } from 'react-i18next';

const QuickViewModal = ({ product, isOpen, onClose }) => {
    const { t } = useTranslation();
    const { addToCart } = useContext(CartContext);
    const { toggleWishlist, isInWishlist } = useContext(WishlistContext);

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState(product?.size || 'M');
    const [selectedColor, setSelectedColor] = useState(product?.color || 'Negro');
    const [quantity, setQuantity] = useState(1);

    // Mock imágenes adicionales (igual que en ProductDetail)
    const productImages = product ? [
        product.image,
        'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1594633312681-86309903deb9?auto=format&fit=crop&w=800&q=80',
    ] : [];

    const availableColors = ['Rojo', 'Azul', 'Negro', 'Gris', 'Rosa', 'Verde', 'Beige', 'Blanco', 'Marrón', 'Plateado'];
    const availableSizes = ['XS', 'S', 'M', 'L', 'XL'];

    const handleAddToCart = () => {
        if (!product) return;
        addToCart(product, selectedSize, selectedColor);
        // Pequeña animación de éxito
        const btn = document.getElementById('quick-add-btn');
        if (btn) {
            btn.textContent = '¡Añadido! ✓';
            setTimeout(() => {
                if (btn) btn.textContent = t('addToCart');
            }, 1500);
        }
    };

    // Cerrar con ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!product) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="bg-warm-50 dark:bg-gray-950 w-full max-w-6xl mx-4 rounded-3xl overflow-hidden shadow-2xl relative"
                    >
                        {/* Botón cerrar premium */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-50 p-3 bg-warm-50/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl hover:scale-110 transition-all shadow-lg"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[85vh]">
                            {/* === GALERÍA CON ZOOM === */}
                            <div className="relative bg-warm-200 dark:bg-gray-900 p-8 flex items-center justify-center overflow-hidden">
                                <TransformWrapper
                                    initialScale={1}
                                    minScale={0.8}
                                    maxScale={4}
                                    wheel={{ disabled: false }}
                                >
                                    <TransformComponent>
                                        <motion.img
                                            key={selectedImage}
                                            src={productImages[selectedImage]}
                                            alt={product.name}
                                            className="max-h-[75vh] w-auto object-contain rounded-3xl shadow-2xl"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        />
                                    </TransformComponent>
                                </TransformWrapper>

                                {/* Thumbnails */}
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                                    {productImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-blue-600 scale-110' : 'border-transparent hover:border-warm-500'}`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* === DETALLES === */}
                            <div className="p-10 lg:p-16 flex flex-col">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="text-4xl font-bold tracking-tighter">{product.name}</h1>
                                        <p className="text-3xl font-semibold text-blue-600 mt-2">${product.price.toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleWishlist(product)}
                                        className="p-4 hover:scale-110 transition-all"
                                    >
                                        <Heart className={`w-7 h-7 ${isInWishlist(product.id) ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
                                    </button>
                                </div>

                                {/* Rating */}
                                <div className="flex items-center gap-2 mt-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                    <span className="text-sm text-gray-500 ml-2">(128 {t('reviews')})</span>
                                </div>

                                <p className="mt-8 text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {product.name} {t('descriptionText', { category: product.category.toLowerCase() })}.
                                </p>

                                {/* Color */}
                                <div className="mt-10">
                                    <p className="font-medium mb-3">{t('color')}: <span className="font-semibold">{selectedColor}</span></p>
                                    <div className="flex gap-3 flex-wrap">
                                        {availableColors.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setSelectedColor(color)}
                                                className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color ? 'border-blue-600 scale-110' : 'border-transparent hover:border-warm-500'}`}
                                                style={{ backgroundColor: color.toLowerCase() }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Talla */}
                                <div className="mt-8">
                                    <p className="font-medium mb-3">{t('size')}: <span className="font-semibold">{selectedSize}</span></p>
                                    <div className="flex flex-wrap gap-3">
                                        {availableSizes.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-6 py-3 rounded-2xl font-medium transition-all ${selectedSize === size
                                                    ? 'bg-black text-white dark:bg-white dark:text-black'
                                                    : 'bg-warm-300 dark:bg-gray-800 hover:bg-warm-400 dark:hover:bg-gray-700'}`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Cantidad + Add to Cart */}
                                <div className="mt-auto pt-10 border-t dark:border-gray-800">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center border dark:border-gray-700 rounded-2xl">
                                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-5 py-4 text-2xl hover:bg-warm-300 dark:hover:bg-gray-800 rounded-l-2xl">-</button>
                                            <span className="px-8 font-semibold text-xl">{quantity}</span>
                                            <button onClick={() => setQuantity(quantity + 1)} className="px-5 py-4 text-2xl hover:bg-warm-300 dark:hover:bg-gray-800 rounded-r-2xl">+</button>
                                        </div>

                                        <button
                                            id="quick-add-btn"
                                            onClick={handleAddToCart}
                                            className="flex-1 bg-black hover:bg-blue-600 active:scale-95 text-white py-5 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3"
                                        >
                                            <ShoppingCart className="w-6 h-6" />
                                            {t('addToCart')}
                                        </button>
                                    </div>

                                    <p className="text-center text-xs text-gray-400 mt-6">Envío gratis • Devolución fácil en 30 días</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default QuickViewModal;