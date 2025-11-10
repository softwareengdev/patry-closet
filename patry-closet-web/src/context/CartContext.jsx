import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            setCartItems(JSON.parse(storedCart));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, size, color) => {
        const existingItem = cartItems.find(item => item.id === product.id && item.size === size && item.color === color);
        if (existingItem) {
            setCartItems(prev => prev.map(item =>
                item.id === product.id && item.size === size && item.color === color
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCartItems(prev => [...prev, { ...product, size, color, quantity: 1 }]);
        }
    };

    const removeFromCart = (id, size, color) => {
        setCartItems(prev => prev.filter(item => !(item.id === id && item.size === size && item.color === color)));
    };

    const updateQuantity = (id, size, color, quantity) => {
        setCartItems(prev => prev.map(item =>
            item.id === id && item.size === size && item.color === color
                ? { ...item, quantity: Math.max(1, quantity) }
                : item
        ));
    };

    const getTotal = () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const getItemCount = () => cartItems.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, getTotal, getItemCount }}>
            {children}
        </CartContext.Provider>
    );
};