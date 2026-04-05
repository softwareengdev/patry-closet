import { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Heart,
  ShoppingCart,
  Check,
  ChevronRight,
  Minus,
  Plus,
  Maximize2,
  X,
  Truck,
  RotateCcw,
  Ruler,
  BadgeCheck,
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useTranslation } from 'react-i18next';
import { COLOR_MAP } from '../data/products';
import { useProduct, useRelatedProducts } from '../hooks/useProducts';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import SizeGuideModal from './SizeGuideModal';
import ProductCard from './ProductCard';
import SEOHead, { getProductSchema, getBreadcrumbSchema } from './SEOHead';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getProductImages = (product) => {
  if (product.images && product.images.length > 0) return product.images;
  return [
    product.image,
    product.hoverImage,
  ].filter(Boolean);
};

const getStockForSize = (productId, size) => {
  const idNum = typeof productId === 'number' ? productId : [...String(productId)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const hash = (idNum * 7 + size.charCodeAt(0) * 13) % 20;
  return hash < 3 ? 0 : hash < 6 ? 2 : 10;
};

const MOCK_REVIEWS = [
  {
    id: 1,
    name: 'María García',
    date: '2024-11-12',
    rating: 5,
    text: 'Absolutely love this piece! The fabric quality is superb and the fit is exactly as described. Will definitely order more.',
    verified: true,
  },
  {
    id: 2,
    name: 'Laura Sánchez',
    date: '2024-10-28',
    rating: 4,
    text: 'Great quality for the price. The color is vibrant and true to the photos. Shipping was fast too.',
    verified: true,
  },
  {
    id: 3,
    name: 'Carlos Ruiz',
    date: '2024-10-15',
    rating: 5,
    text: 'Bought this as a gift and it was a hit. Elegant design and luxurious feel. Highly recommended.',
    verified: false,
  },
  {
    id: 4,
    name: 'Ana Martínez',
    date: '2024-09-30',
    rating: 4,
    text: 'Very comfortable to wear all day. The stitching is well done. Only minor issue was the packaging could be nicer.',
    verified: true,
  },
];

const RATING_DISTRIBUTION = [
  { stars: 5, pct: 65 },
  { stars: 4, pct: 20 },
  { stars: 3, pct: 10 },
  { stars: 2, pct: 3 },
  { stars: 1, pct: 2 },
];

const TAB_KEYS = ['details', 'shipping', 'returns', 'reviews'];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StarRating({ rating, size = 16 }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, i) => {
        const fill = Math.min(Math.max(rating - i, 0), 1);
        return (
          <span key={i} className="relative" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-gray-300 dark:text-gray-600" size={size} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-amber-400" size={size} fill="currentColor" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function StockDot({ stock }) {
  if (stock === 0) return <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />;
  if (stock < 3) return <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ProductDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: product, isLoading } = useProduct(id);
  const { data: relatedProducts = [] } = useRelatedProducts(product?.id, 8);

  const { addToCart, triggerFlyToCart } = useContext(CartContext);
  const { toggleWishlist, isInWishlist } = useContext(WishlistContext);

  const addBtnRef = useRef(null);
  const reviewsTabRef = useRef(null);
  const tabPanelRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Reset state when product changes
  useEffect(() => {
    if (!product) return;
    setSelectedColor(product.color || product.colors?.[0] || '');
    setSelectedSize(product.size !== '-' ? product.size || product.sizes?.[0] || '' : product.sizes?.[0] || '');
    setSelectedImage(0);
    setQuantity(1);
    setActiveTab('details');
    setAddedFeedback(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-600 dark:text-gray-400">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-lg">{t('loading', 'Loading…')}</p>
      </div>
    );
  }

  // Not-found guard (hooks above, JSX below)
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-600 dark:text-gray-400">
        <p className="text-xl font-medium mb-4">{t('productNotFound', 'Product not found')}</p>
        <Link to="/products" className="text-blue-600 hover:underline">
          ← {t('backToProducts', 'Back to products')}
        </Link>
      </div>
    );
  }

  const images = getProductImages(product);
  const currentStock = selectedSize ? getStockForSize(product.id, selectedSize) : 10;
  const isOutOfStock = currentStock === 0;
  const maxQty = Math.min(currentStock, 10);

  const categoryForSizeGuide =
    product.category === 'Hombres' ? 'Hombres' : product.category === 'Accesorios' ? 'Accesorios' : 'women';

  // Handlers ----------------------------------------------------------------

  const handleAddToCart = () => {
    if (isOutOfStock || addedFeedback) return;
    const rect = addBtnRef.current?.getBoundingClientRect();
    if (rect) triggerFlyToCart(rect);
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize, selectedColor);
    }
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  const handleTabKeyboard = (e) => {
    const idx = TAB_KEYS.indexOf(activeTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTab(TAB_KEYS[(idx + 1) % TAB_KEYS.length]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTab(TAB_KEYS[(idx - 1 + TAB_KEYS.length) % TAB_KEYS.length]);
    }
  };

  const scrollToReviews = () => {
    setActiveTab('reviews');
    setTimeout(() => reviewsTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  // Render ------------------------------------------------------------------

  return (
    <motion.article
      className="min-h-screen bg-warm-200 dark:bg-gray-950 pb-20"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SEOHead
        title={`${product.name} — ${product.category}`}
        description={`Comprar ${product.name} en PATRY♡CLOSET. ${product.description?.slice(0, 120) || 'Moda premium online'}. Envío gratuito en pedidos +50€.`}
        canonical={`/products/${product.id}`}
        image={product.images?.[0] || product.image}
        type="product"
        jsonLd={[
          getProductSchema(product),
          getBreadcrumbSchema([
            { name: 'Inicio', url: '/' },
            { name: product.category, url: `/products?category=${product.category}` },
            { name: product.name },
          ]),
        ]}
      />
      {/* ── Breadcrumbs ─────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <ol className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
          <li>
            <Link to="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              {t('home', 'Home')}
            </Link>
          </li>
          <li><ChevronRight size={14} /></li>
          <li>
            <Link to="/products" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              {product.category}
            </Link>
          </li>
          <li><ChevronRight size={14} /></li>
          <li className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Two-column layout ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 lg:gap-12">
          {/* ════════════ LEFT: IMAGE GALLERY ════════════ */}
          <section aria-label="Product images" className="space-y-4">
            {/* Main image */}
            <div className="relative overflow-hidden bg-warm-50 dark:bg-gray-900 shadow-sm group">
              <TransformWrapper
                key={selectedImage}
                initialScale={1}
                minScale={1}
                maxScale={3}
                wheel={{ step: 0.1 }}
              >
                <TransformComponent
                  wrapperStyle={{ width: '100%' }}
                  contentStyle={{ width: '100%' }}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImage}
                      src={images[selectedImage]}
                      alt={`${product.name} – image ${selectedImage + 1} of ${images.length}`}
                      className="w-full h-[500px] sm:h-[600px] lg:h-[700px] object-cover cursor-zoom-in"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      draggable={false}
                    />
                  </AnimatePresence>
                </TransformComponent>
              </TransformWrapper>

              {/* Image counter */}
              <span className="absolute bottom-4 left-4 bg-black/60 text-white text-xs font-medium px-2.5 py-1 backdrop-blur-sm">
                {selectedImage + 1}/{images.length}
              </span>

              {/* Expand button */}
              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute top-4 right-4 p-2 bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Open fullscreen view"
              >
                <Maximize2 size={18} />
              </button>
            </div>

            {/* Thumbnails – vertical on desktop, horizontal scroll on mobile */}
            <div
              className="flex lg:flex-row gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 snap-x snap-mandatory scrollbar-hide"
              role="listbox"
              aria-label="Product thumbnails"
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 overflow-hidden border-2 transition-all snap-start ${
                    selectedImage === idx
                      ? 'border-gray-900 dark:border-white ring-2 ring-gray-900/20 dark:ring-white/20'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  role="option"
                  aria-selected={selectedImage === idx}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </section>

          {/* ════════════ RIGHT: PRODUCT INFO (sticky) ════════════ */}
          <motion.section
            className="lg:sticky lg:top-24 lg:self-start space-y-6"
            aria-label="Product information"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {/* Brand */}
            {product.brand && (
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 dark:text-gray-400">
                {product.brand}
              </p>
            )}

            {/* Name */}
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <button
              onClick={scrollToReviews}
              className="flex items-center gap-2 group/rating"
              aria-label={`${product.rating} stars, ${product.reviewCount} reviews – click to see reviews`}
            >
              <StarRating rating={product.rating} size={18} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {product.rating}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 group-hover/rating:underline">
                ({product.reviewCount} {t('reviews', 'reviews')})
              </span>
            </button>

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-gray-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
              {product.discount > 0 && (
                <span className="text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5">
                  -{product.discount}%
                </span>
              )}
            </div>

            {/* Short description */}
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.description || (
                <>
                  {t('premiumPiece', 'A premium piece from our')}{' '}
                  <span className="font-medium text-gray-800 dark:text-gray-200">{product.category}</span>{' '}
                  {t('collectionDesc', 'collection. Crafted with attention to detail for the modern wardrobe.')}
                </>
              )}
            </p>

            <hr className="border-warm-400 dark:border-gray-800" />

            {/* ── Color selector ─────────────────────────────────── */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('color', 'Color')}:{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((color) => {
                    const hex = COLOR_MAP[color] || '#999';
                    const isActive = selectedColor === color;
                    const isLight = ['Blanco', 'Crema', 'Beige', 'Lavanda', 'Plateado'].includes(color);
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`relative w-9 h-9 rounded-full transition-all ${
                          isActive
                            ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-950'
                            : 'hover:scale-110'
                        } ${isLight ? 'border border-warm-500 dark:border-gray-600' : ''}`}
                        style={{ backgroundColor: hex }}
                        aria-label={`${t('selectColor', 'Select color')} ${color}`}
                        aria-pressed={isActive}
                      >
                        {isActive && (
                          <Check
                            size={16}
                            className={`absolute inset-0 m-auto ${isLight ? 'text-gray-700' : 'text-white'}`}
                            strokeWidth={3}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Size selector ──────────────────────────────────── */}
            {product.sizes && product.sizes.length > 0 && product.sizes[0] !== '-' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('size', 'Size')}:{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedSize}</span>
                  </p>
                  <button
                    onClick={() => setSizeGuideOpen(true)}
                    className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    aria-label="Open size guide"
                  >
                    <Ruler size={14} />
                    {t('sizeGuide', 'Size Guide')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const stock = getStockForSize(product.id, size);
                    const isActive = selectedSize === size;
                    const disabled = stock === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => {
                          if (!disabled) {
                            setSelectedSize(size);
                            setQuantity(1);
                          }
                        }}
                        disabled={disabled}
                        className={`relative min-w-[3rem] px-4 py-2.5 text-sm font-medium border transition-all flex items-center justify-center gap-1.5 ${
                          disabled
                            ? 'border-warm-400 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through'
                            : isActive
                            ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'border-warm-500 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-white'
                        }`}
                        aria-label={`${t('selectSize', 'Select size')} ${size}${
                          disabled ? ' – out of stock' : stock < 3 ? ' – low stock' : ''
                        }`}
                        aria-pressed={isActive}
                      >
                        {size}
                        <StockDot stock={stock} />
                      </button>
                    );
                  })}
                </div>
                {currentStock > 0 && currentStock < 3 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1.5 font-medium">
                    Only {currentStock} left in stock!
                  </p>
                )}
              </div>
            )}

            {/* ── Quantity ───────────────────────────────────────── */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('quantity', 'Quantity')}
              </p>
              <div className="inline-flex items-center border border-warm-500 dark:border-gray-600 overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="px-3.5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-warm-300 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center font-medium text-gray-900 dark:text-white select-none" aria-live="polite">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty || isOutOfStock}
                  className="px-3.5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-warm-300 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* ── Action buttons ──────────────────────────────────── */}
            <div className="flex gap-3 pt-2">
              <motion.button
                ref={addBtnRef}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                whileHover={{ scale: isOutOfStock ? 1 : 1.02 }}
                whileTap={{ scale: isOutOfStock ? 1 : 0.97 }}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium uppercase tracking-wider transition-colors ${
                  addedFeedback
                    ? 'bg-emerald-600 text-white'
                    : isOutOfStock
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-800'
                }`}
                aria-label={
                  isOutOfStock
                    ? 'Out of stock'
                    : addedFeedback
                    ? 'Added to cart'
                    : t('addToCart', 'Add to Cart')
                }
              >
                {addedFeedback ? (
                  <>
                    <Check size={20} /> {t('addedToCart', 'Added!')}
                  </>
                ) : isOutOfStock ? (
                  t('outOfStock', 'Out of Stock')
                ) : (
                  <>
                    <ShoppingCart size={20} /> {t('addToCart', 'Add to Cart')}
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={() => toggleWishlist(product)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className={`w-14 flex items-center justify-center border transition-colors ${
                  isInWishlist(product.id)
                    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-500'
                    : 'border-warm-500 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-300'
                }`}
                aria-label={
                  isInWishlist(product.id)
                    ? t('removeFromWishlist', 'Remove from wishlist')
                    : t('addToWishlist', 'Add to wishlist')
                }
                aria-pressed={isInWishlist(product.id)}
              >
                <Heart
                  size={22}
                  fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
                />
              </motion.button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Truck, label: t('freeShipping', 'Free Shipping') },
                { icon: RotateCcw, label: t('easyReturns', '30-Day Returns') },
                { icon: BadgeCheck, label: t('secureCheckout', 'Secure Checkout') },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 py-3 bg-warm-300 dark:bg-gray-900 text-center"
                >
                  <Icon size={18} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── TABBED DESCRIPTION SECTION ─────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section className="mt-16 lg:mt-24" ref={reviewsTabRef} aria-label="Product details tabs">
          {/* Tab bar */}
          <div
            role="tablist"
            aria-label="Product information tabs"
            className="flex gap-1 border-b border-warm-400 dark:border-gray-800 overflow-x-auto scrollbar-hide"
            onKeyDown={handleTabKeyboard}
          >
            {TAB_KEYS.map((key) => {
              const labels = {
                details: t('details', 'Details'),
                shipping: t('shipping', 'Shipping'),
                returns: t('returns', 'Returns'),
                reviews: `${t('reviews', 'Reviews')} (${product.reviewCount})`,
              };
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  role="tab"
                  id={`tab-${key}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${key}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(key)}
                  className={`relative whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {labels[key]}
                  {isActive && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab panels */}
          <div ref={tabPanelRef} className="py-8 min-h-[300px]">
            <AnimatePresence mode="wait">
              {/* Details */}
              {activeTab === 'details' && (
                <motion.div
                  key="details"
                  role="tabpanel"
                  id="panel-details"
                  aria-labelledby="tab-details"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-3xl space-y-6 text-gray-700 dark:text-gray-300"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('description', 'Description')}
                    </h3>
                    <p className="leading-relaxed">
                      {product.description || `${product.name} is an exceptional piece from our ${product.category} collection.`}
                      {' '}Designed with meticulous attention to detail, this garment combines contemporary
                      aesthetics with timeless elegance. Perfect for any occasion, from casual outings to
                      formal events.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('material', 'Material')}
                    </h3>
                    <ul className="space-y-1.5 list-disc pl-5">
                      <li>Premium cotton blend (95% Cotton, 5% Elastane)</li>
                      <li>Breathable and soft-touch fabric</li>
                      <li>Reinforced stitching for durability</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Care Instructions
                    </h3>
                    <ul className="space-y-1.5 list-disc pl-5">
                      <li>Machine wash cold with similar colors</li>
                      <li>Do not bleach</li>
                      <li>Tumble dry low</li>
                      <li>Iron on low heat if needed</li>
                      <li>Do not dry clean</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* Shipping */}
              {activeTab === 'shipping' && (
                <motion.div
                  key="shipping"
                  role="tabpanel"
                  id="panel-shipping"
                  aria-labelledby="tab-shipping"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-3xl space-y-6 text-gray-700 dark:text-gray-300"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Shipping Methods
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-warm-400 dark:border-gray-700 overflow-hidden">
                      <thead className="bg-warm-300 dark:bg-gray-800 text-gray-900 dark:text-white">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold">Method</th>
                          <th className="text-left px-4 py-3 font-semibold">Delivery</th>
                          <th className="text-left px-4 py-3 font-semibold">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-400 dark:divide-gray-700">
                        <tr>
                          <td className="px-4 py-3 font-medium">Standard</td>
                          <td className="px-4 py-3">5–7 business days</td>
                          <td className="px-4 py-3">Free over $50 / $4.99</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">Express</td>
                          <td className="px-4 py-3">2–3 business days</td>
                          <td className="px-4 py-3">$9.99</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium">Same Day</td>
                          <td className="px-4 py-3">Same day (select areas)</td>
                          <td className="px-4 py-3">$14.99</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Orders placed before 2 PM are shipped the same business day. Tracking information
                    will be sent to your email once your order has shipped.
                  </p>
                </motion.div>
              )}

              {/* Returns */}
              {activeTab === 'returns' && (
                <motion.div
                  key="returns"
                  role="tabpanel"
                  id="panel-returns"
                  aria-labelledby="tab-returns"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-3xl space-y-6 text-gray-700 dark:text-gray-300"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    30-Day Return Policy
                  </h3>
                  <p className="leading-relaxed">
                    We want you to love your purchase. If you&apos;re not completely satisfied, you can
                    return any unworn item within 30 days of delivery for a full refund or exchange.
                  </p>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Return Conditions
                    </h4>
                    <ul className="space-y-1.5 list-disc pl-5">
                      <li>Items must be unworn, unwashed, and in original condition</li>
                      <li>All tags must be attached</li>
                      <li>Original packaging must be included</li>
                      <li>Sale items are eligible for exchange or store credit only</li>
                      <li>Intimates and swimwear are final sale for hygiene reasons</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    To initiate a return, visit your account&apos;s order history or contact our support
                    team. Return shipping is free for orders within the continental US.
                  </p>
                </motion.div>
              )}

              {/* Reviews */}
              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  role="tabpanel"
                  id="panel-reviews"
                  aria-labelledby="tab-reviews"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8"
                >
                  {/* Rating summary */}
                  <div className="flex flex-col sm:flex-row gap-8 items-start">
                    {/* Big rating */}
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">
                        {product.rating}
                      </span>
                      <StarRating rating={product.rating} size={20} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {product.reviewCount} {t('reviews', 'reviews')}
                      </span>
                    </div>

                    {/* Distribution bars */}
                    <div className="flex-1 max-w-sm space-y-2">
                      {RATING_DISTRIBUTION.map(({ stars, pct }) => (
                        <div key={stars} className="flex items-center gap-2 text-sm">
                          <span className="w-6 text-right text-gray-600 dark:text-gray-400 font-medium">
                            {stars}
                          </span>
                          <Star size={12} className="text-amber-400" fill="currentColor" />
                          <div className="flex-1 h-2.5 bg-warm-400 dark:bg-gray-700 overflow-hidden">
                            <motion.div
                              className="h-full bg-amber-400"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: stars * 0.08 }}
                            />
                          </div>
                          <span className="w-10 text-right text-gray-500 dark:text-gray-400">
                            {pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr className="border-warm-400 dark:border-gray-800" />

                  {/* Individual reviews */}
                  <div className="space-y-6">
                    {MOCK_REVIEWS.map((review) => (
                      <div key={review.id} className="flex gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-warm-400 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                          {review.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                              {review.name}
                            </span>
                            {review.verified && (
                              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <BadgeCheck size={12} /> Verified
                              </span>
                            )}
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(review.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="mt-1">
                            <StarRating rating={review.rating} size={14} />
                          </div>
                          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {review.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── RELATED PRODUCTS ──────────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 lg:mt-24" aria-label="Related products">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400 text-center mb-3">
              {t('relatedProducts', 'You May Also Like')}
            </h2>
            <p className="text-2xl sm:text-3xl font-serif font-light tracking-tight text-gray-900 dark:text-white text-center mb-8">
              {t('relatedProductsHeading', 'Complete the Look')}
            </p>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
              {relatedProducts.slice(0, 8).map((rel) => (
                <div
                  key={rel.id}
                  className="flex-shrink-0 w-[260px] sm:w-[280px] lg:w-auto snap-start"
                >
                  <ProductCard product={rel} onQuickView={() => {}} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── LIGHTBOX ─────────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-label="Fullscreen image viewer"
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-5 right-5 p-2 bg-white/10 text-white hover:bg-warm-50/20 transition-colors z-10"
              aria-label="Close fullscreen view"
            >
              <X size={24} />
            </button>

            <div className="relative w-full max-w-4xl max-h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
              <TransformWrapper initialScale={1} minScale={1} maxScale={4}>
                <TransformComponent
                  wrapperStyle={{ width: '100%', maxHeight: '85vh' }}
                  contentStyle={{ width: '100%' }}
                >
                  <img
                    src={images[selectedImage]}
                    alt={`${product.name} – fullscreen image ${selectedImage + 1}`}
                    className="w-full max-h-[85vh] object-contain"
                    draggable={false}
                  />
                </TransformComponent>
              </TransformWrapper>
            </div>

            {/* Lightbox thumbnails */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(idx);
                  }}
                  className={`w-14 h-14 overflow-hidden border-2 transition-all ${
                    selectedImage === idx ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Size Guide Modal ─────────────────────────────────────── */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        category={categoryForSizeGuide}
        selectedSize={selectedSize}
      />
    </motion.article>
  );
};

export default ProductDetail;