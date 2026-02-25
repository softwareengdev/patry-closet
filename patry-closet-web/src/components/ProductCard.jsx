import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { Heart, ShoppingCart } from 'lucide-react';

const ProductCard = ({ product, showQuickAdd = true }) => {
    const { addToCart } = useContext(CartContext);
    const { toggleWishlist, isInWishlist } = useContext(WishlistContext);

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 relative"
        >
            <div className="relative overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-96 object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <button
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-gray-900/90 rounded-full hover:scale-110 transition"
                >
                    <Heart className={`w-5 h-5 transition ${isInWishlist(product.id) ? 'fill-rose-500 text-rose-500' : 'text-gray-700'}`} />
                </button>
            </div>

            <div className="p-6">
                <Link to={`/products/${product.id}`} className="block">
                    <h3 className="font-semibold text-xl mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-2xl font-bold text-blue-600">${product.price.toFixed(2)}</p>
                </Link>

                {showQuickAdd && (
                    <button
                        onClick={() => addToCart(product, product.size || 'M', product.color || 'Negro')}
                        className="mt-4 w-full bg-black hover:bg-blue-600 text-white py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <ShoppingCart className="w-5 h-5" /> Añadir rápido
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default ProductCard;