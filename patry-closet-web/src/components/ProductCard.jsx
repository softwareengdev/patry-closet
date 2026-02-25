import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';

const ProductCard = ({ product, onQuickView }) => {
    const { addToCart } = useContext(CartContext);
    const { toggleWishlist, isInWishlist } = useContext(WishlistContext);

    const handleQuickAdd = (e) => {
        e.preventDefault();
        addToCart(product, product.size || 'M', product.color || 'Negro');
    };

    const handleQuickViewClick = (e) => {
        e.preventDefault();
        onQuickView(product);
    };

    return (
        <motion.div
            whileHover={{ y: -12 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="group relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
        >
            {/* Imagen con hover zoom elegante */}
            <div className="relative overflow-hidden aspect-[4/5]">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />

                {/* Overlay acciones rápidas */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6 gap-3">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleQuickAdd}
                        className="bg-white text-black px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-xl hover:bg-blue-600 hover:text-white transition-all"
                    >
                        <ShoppingCart className="w-5 h-5" /> Añadir rápido
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleQuickViewClick}
                        className="bg-white/90 backdrop-blur-md p-3 rounded-2xl hover:bg-white transition-all"
                    >
                        <Eye className="w-5 h-5" />
                    </motion.button>
                </div>

                {/* Heart wishlist */}
                <button
                    onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                    className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-2xl hover:scale-110 transition-all z-10"
                >
                    <Heart
                        className={`w-5 h-5 transition-all ${isInWishlist(product.id) ? 'fill-rose-500 text-rose-500' : 'text-gray-700 dark:text-gray-300'}`}
                    />
                </button>
            </div>

            {/* Info */}
            <div className="p-6">
                <Link to={`/products/${product.id}`} className="block group-hover:text-blue-600 transition-colors">
                    <h3 className="font-semibold text-xl tracking-tight line-clamp-2 mb-2">{product.name}</h3>
                </Link>
                <p className="text-2xl font-bold text-blue-600">${product.price.toFixed(2)}</p>
            </div>
        </motion.div>
    );
};

export default ProductCard;