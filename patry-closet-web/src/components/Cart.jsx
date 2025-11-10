import { useContext } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ShoppingBag } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { useTranslation } from 'react-i18next';

const Cart = () => {
    const { t } = useTranslation();
    const { cartItems, removeFromCart, updateQuantity, getTotal } = useContext(CartContext);

    if (cartItems.length === 0) {
        return (
            <section className="py-20 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <div className="text-center text-gray-700 dark:text-gray-300">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                    <h2 className="text-2xl font-bold">{t('emptyCart')}</h2>
                    <p>{t('emptyCartMessage')}</p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200">{t('yourCart')}</h1>
                <div className="space-y-8">
                    {cartItems.map(item => (
                        <motion.div
                            key={`${item.id}-${item.size}-${item.color}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center justify-between"
                        >
                            <div className="flex items-center space-x-4">
                                <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                                    <p className="text-gray-700 dark:text-gray-300">{t('size')}: {item.size} | {t('color')}: {item.color}</p>
                                    <p className="text-lg font-medium text-blue-600">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateQuantity(item.id, item.size, item.color, parseInt(e.target.value))}
                                    className="w-16 px-2 py-1 border rounded-lg text-center dark:bg-gray-700 dark:text-white"
                                    min="1"
                                    aria-label={`${t('quantityFor')} ${item.name}`}
                                />
                                <button onClick={() => removeFromCart(item.id, item.size, item.color)} className="text-red-600 hover:text-red-800" aria-label={`${t('remove')} ${item.name}`}>
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
                <div className="mt-12 text-right">
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t('total')}: ${getTotal().toFixed(2)}</p>
                    <button className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition">{t('checkout')}</button>
                </div>
            </div>
        </section>
    );
};

export default Cart;