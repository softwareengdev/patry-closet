import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowLeft, Heart, ShoppingCart } from 'lucide-react';
import Carousel from 'infinite-react-carousel'; // Reutilizando para carrusel de relacionados
import { mockProducts } from './ProductsPage'; // Importa el mock desde ProductsPage (ajusta la ruta si es necesario)

// Mock para imágenes múltiples por producto (agrega más URLs reales cuando sea posible)
const getProductImages = (product) => [
    product.image,
    'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=800&q=80', // Placeholder 1
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80', // Placeholder 2
    'https://images.unsplash.com/photo-1594633312681-86309903deb9?auto=format&fit=crop&w=800&q=80', // Placeholder 3
];

const ProductDetail = () => {
    const { id } = useParams();
    const product = mockProducts.find(p => p.id === parseInt(id));

    if (!product) {
        return <div className="py-20 text-center text-gray-700">Producto no encontrado</div>;
    }

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState(product.size || 'M');
    const [selectedColor, setSelectedColor] = useState(product.color || 'Negro');

    // Mock para productos relacionados (filtra similares por categoría)
    const relatedProducts = mockProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

    // Colores y tallas disponibles (extiende según necesidades)
    const availableColors = ['Rojo', 'Azul', 'Negro', 'Gris', 'Rosa', 'Verde', 'Beige', 'Blanco', 'Marrón', 'Plateado'];
    const availableSizes = ['XS', 'S', 'M', 'L', 'XL'];

    return (
        <section className="py-20 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Botón de regreso */}
                <Link to="/products" className="flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Volver a Productos
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Galería de Imágenes */}
                    <div className="space-y-4">
                        <motion.img
                            key={selectedImage}
                            src={getProductImages(product)[selectedImage]}
                            alt={`${product.name} - Imagen ${selectedImage + 1}`}
                            className="w-full h-[600px] object-cover rounded-xl shadow-lg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        />
                        <div className="grid grid-cols-4 gap-4">
                            {getProductImages(product).map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    alt={`Thumbnail ${index + 1}`}
                                    className={`w-full h-32 object-cover rounded-lg cursor-pointer transition-opacity ${selectedImage === index ? 'opacity-100 border-2 border-blue-600' : 'opacity-60 hover:opacity-100'}`}
                                    onClick={() => setSelectedImage(index)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Detalles del Producto */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                        <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>
                        <p className="text-3xl text-blue-600 font-semibold">${product.price.toFixed(2)}</p>

                        {/* Calificaciones (simuladas) */}
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-5 h-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" />
                            ))}
                            <span className="ml-2 text-gray-600">(128 reseñas)</span>
                        </div>

                        {/* Descripción */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Descripción</h2>
                            <p className="text-gray-700">
                                {product.name} es una pieza esencial para tu guardarropa. Fabricado con materiales de alta calidad, ofrece comodidad y estilo para cualquier ocasión. Ideal para {product.category.toLowerCase()}.
                            </p>
                        </div>

                        {/* Características adicionales */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Características</h2>
                            <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                <li>Categoría: {product.category}</li>
                                <li>Material: Algodón premium (simulado; ajusta según datos reales)</li>
                                <li>Stock: Disponible (32 unidades)</li>
                                <li>Envío: Gratis en pedidos superiores a $50</li>
                            </ul>
                        </div>

                        {/* Selección de Color */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Color: {selectedColor}</label>
                            <div className="flex space-x-3">
                                {availableColors.map(color => (
                                    <div
                                        key={color}
                                        className={`w-8 h-8 rounded-full cursor-pointer border-2 ${selectedColor === color ? 'border-blue-600' : 'border-transparent'} hover:border-blue-400 transition-all`}
                                        style={{ backgroundColor: color.toLowerCase() }}
                                        onClick={() => setSelectedColor(color)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Selección de Talla */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Talla: {selectedSize}</label>
                            <div className="flex flex-wrap gap-2">
                                {availableSizes.map(size => (
                                    <span
                                        key={size}
                                        className={`px-4 py-1 rounded-full cursor-pointer transition-colors ${selectedSize === size ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`}
                                        onClick={() => setSelectedSize(size)}
                                    >
                                        {size}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex space-x-4">
                            <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 flex items-center justify-center">
                                <ShoppingCart className="w-5 h-5 mr-2" /> Añadir al Carrito
                            </button>
                            <button className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition duration-200 flex items-center justify-center">
                                <Heart className="w-5 h-5 mr-2" /> Wishlist
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Productos Relacionados */}
                {relatedProducts.length > 0 && (
                    <section className="mt-16">
                        <h3 className="text-3xl font-bold text-center mb-8 text-gray-800">Productos Relacionados</h3>
                        <Carousel slidesToShow={4} arrows arrowsScroll={4} responsive={[{ breakpoint: 1024, settings: { slidesToShow: 3 } }, { breakpoint: 600, settings: { slidesToShow: 2 } }]}>
                            {relatedProducts.map(rel => (
                                <div key={rel.id} className="p-4">
                                    <Link to={`/products/${rel.id}`} className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                                        <img src={rel.image} alt={rel.name} className="w-full h-48 object-cover" />
                                        <div className="p-4">
                                            <h4 className="text-lg font-semibold">{rel.name}</h4>
                                            <p className="text-gray-700">${rel.price.toFixed(2)}</p>
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