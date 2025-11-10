import { useState, useContext } from 'react'; // Agrega useContext
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowLeft, Heart, ShoppingCart } from 'lucide-react';
import Carousel from 'infinite-react-carousel';
import { mockProducts } from './ProductsPage';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useTranslation } from 'react-i18next';
import { CartContext } from '../context/CartContext'; // Agregado

// Mock para imágenes múltiples...
const getProductImages = (product) => [
    product.image,
    'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1594633312681-86309903deb9?auto=format&fit=crop&w=800&q=80',
];

const ProductDetail = () => {
    const { t } = useTranslation();
    const { addToCart } = useContext(CartContext); // Agregado
    const { id } = useParams();
    const product = mockProducts.find(p => p.id === parseInt(id));

    if (!product) {
        return <div className="py-20 text-center text-gray-700 dark:text-gray-300">{t('productNotFound')}</div>;
    }

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState(product.size || 'M');
    const [selectedColor, setSelectedColor] = useState(product.color || 'Negro');

    const relatedProducts = mockProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

    const availableColors = ['Rojo', 'Azul', 'Negro', 'Gris', 'Rosa', 'Verde', 'Beige', 'Blanco', 'Marrón', 'Plateado'];
    const availableSizes = ['XS', 'S', 'M', 'L', 'XL'];

    const handleAddToCart = () => {
        addToCart(product, selectedSize, selectedColor);
        // Opcional: Mostrar toast o notificación de éxito
    };

    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/products" className="flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors" aria-label={t('backToProducts')}>
                    <ArrowLeft className="w-5 h-5 mr-2" /> {t('backToProducts')}
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Galería con zoom */}
                    <div className="space-y-4">
                        <TransformWrapper>
                            <TransformComponent>
                                <motion.img
                                    key={selectedImage}
                                    src={getProductImages(product)[selectedImage]}
                                    alt={`${product.name} - ${t('image')} ${selectedImage + 1}`}
                                    className="w-full h-[600px] object-cover rounded-xl shadow-lg cursor-zoom-in"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                />
                            </TransformComponent>
                        </TransformWrapper>
                        <div className="grid grid-cols-4 gap-4">
                            {getProductImages(product).map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    alt={`${t('thumbnail')} ${index + 1}`}
                                    className={`w-full h-32 object-cover rounded-lg cursor-pointer transition-opacity ${selectedImage === index ? 'opacity-100 border-2 border-blue-600' : 'opacity-60 hover:opacity-100'}`}
                                    onClick={() => setSelectedImage(index)}
                                    aria-label={`${t('selectImage')} ${index + 1}`}
                                    role="button"
                                    tabIndex={0}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Detalles */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
                        <p className="text-3xl text-blue-600 font-semibold">${product.price.toFixed(2)}</p>

                        {/* Calificaciones */}
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-5 h-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-500'}`} fill="currentColor" />
                            ))}
                            <span className="ml-2 text-gray-600 dark:text-gray-400">(128 {t('reviews')})</span>
                        </div>

                        {/* Descripción */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('description')}</h2>
                            <p className="text-gray-700 dark:text-gray-300">
                                {product.name} {t('descriptionText', { category: product.category.toLowerCase() })}.
                            </p>
                        </div>

                        {/* Características */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('features')}</h2>
                            <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                                <li>{t('category')}: {product.category}</li>
                                <li>{t('material')}: {t('premiumCotton')}</li>
                                <li>{t('stock')}: {t('available')} (32 {t('units')})</li>
                                <li>{t('shipping')}: {t('freeShipping')}</li>
                            </ul>
                        </div>

                        {/* Color */}
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">{t('color')}: {selectedColor}</label>
                            <div className="flex space-x-3">
                                {availableColors.map(color => (
                                    <div
                                        key={color}
                                        className={`w-8 h-8 rounded-full cursor-pointer border-2 ${selectedColor === color ? 'border-blue-600' : 'border-transparent'} hover:border-blue-400 transition-all`}
                                        style={{ backgroundColor: color.toLowerCase() }}
                                        onClick={() => setSelectedColor(color)}
                                        aria-label={`${t('selectColor')} ${color}`}
                                        role="button"
                                        tabIndex={0}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Talla */}
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">{t('size')}: {selectedSize}</label>
                            <div className="flex flex-wrap gap-2">
                                {availableSizes.map(size => (
                                    <span
                                        key={size}
                                        className={`px-4 py-1 rounded-full cursor-pointer transition-colors ${selectedSize === size ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900'}`}
                                        onClick={() => setSelectedSize(size)}
                                        aria-label={`${t('selectSize')} ${size}`}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        {size}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex space-x-4">
                            <button
                                onClick={handleAddToCart} // Agregado: Llama a addToCart
                                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                                aria-label={t('addToCart')}
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" /> {t('addToCart')}
                            </button>
                            <button className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 flex items-center justify-center" aria-label={t('addToWishlist')}>
                                <Heart className="w-5 h-5 mr-2" /> {t('wishlist')}
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Relacionados */}
                {relatedProducts.length > 0 && (
                    <section className="mt-16">
                        <h3 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">{t('relatedProducts')}</h3>
                        <Carousel slidesToShow={4} arrows arrowsScroll={4} responsive={[{ breakpoint: 1024, settings: { slidesToShow: 3 } }, { breakpoint: 600, settings: { slidesToShow: 2 } }]}>
                            {relatedProducts.map(rel => (
                                <div key={rel.id} className="p-4">
                                    <Link to={`/products/${rel.id}`} className="block bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                                        <img src={rel.image} alt={rel.name} className="w-full h-48 object-cover" />
                                        <div className="p-4">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{rel.name}</h4>
                                            <p className="text-gray-700 dark:text-gray-300">${rel.price.toFixed(2)}</p>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </Carousel>
                    </section>
                )}
            </div>
        </section>
    );
};

export default ProductDetail;