import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export const CartContext = createContext();

const COUPONS = {
    PATRY10: { type: 'percent', value: 10 },
    WELCOME20: { type: 'percent', value: 20 },
    FREESHIP: { type: 'shipping', value: 0 },
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [coupon, setCoupon] = useState(null);
    const [miniCartOpen, setMiniCartOpen] = useState(false);
    const [flyToCartAnimation, setFlyToCartAnimation] = useState(null);
    const flyTimerRef = useRef(null);

    // Hydrate cart from localStorage on mount
    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            setCartItems(JSON.parse(storedCart));
        }
    }, []);

    // Persist cart to localStorage on change
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Cleanup fly-to-cart timer on unmount
    useEffect(() => {
        return () => {
            if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
        };
    }, []);

    const addToCart = useCallback((product, size, color) => {
        setCartItems(prev => {
            const idx = prev.findIndex(
                item => item.id === product.id && item.size === size && item.color === color,
            );
            if (idx !== -1) {
                return prev.map((item, i) =>
                    i === idx ? { ...item, quantity: item.quantity + 1 } : item,
                );
            }
            return [...prev, { ...product, size, color, quantity: 1 }];
        });
    }, []);

    const removeFromCart = useCallback((id, size, color) => {
        setCartItems(prev =>
            prev.filter(item => !(item.id === id && item.size === size && item.color === color)),
        );
    }, []);

    const updateQuantity = useCallback((id, size, color, quantity) => {
        setCartItems(prev =>
            prev.map(item =>
                item.id === id && item.size === size && item.color === color
                    ? { ...item, quantity: Math.max(1, quantity) }
                    : item,
            ),
        );
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
        setCoupon(null);
    }, []);

    const getTotal = useCallback(
        () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [cartItems],
    );

    const getSubtotal = useCallback(() => getTotal(), [getTotal]);

    const getItemCount = useCallback(
        () => cartItems.reduce((count, item) => count + item.quantity, 0),
        [cartItems],
    );

    const getShipping = useCallback(() => {
        if (coupon?.type === 'shipping') return 0;
        return getSubtotal() >= 50 ? 0 : 4.99;
    }, [getSubtotal, coupon]);

    const getTax = useCallback(
        (rate = 0.21) => getSubtotal() * rate,
        [getSubtotal],
    );

    const getDiscount = useCallback(() => {
        if (!coupon) return 0;
        if (coupon.type === 'percent') return getSubtotal() * (coupon.value / 100);
        return 0;
    }, [coupon, getSubtotal]);

    const getGrandTotal = useCallback(
        () => getSubtotal() - getDiscount() + getShipping() + getTax(),
        [getSubtotal, getDiscount, getShipping, getTax],
    );

    const applyCoupon = useCallback((code) => {
        const key = code?.toUpperCase().trim();
        const match = COUPONS[key];
        if (!match) {
            return { success: false, message: 'Invalid coupon code', type: null, value: 0 };
        }
        setCoupon({ code: key, type: match.type, value: match.value });
        return {
            success: true,
            message:
                match.type === 'percent'
                    ? `${match.value}% discount applied!`
                    : 'Free shipping applied!',
            type: match.type,
            value: match.value,
        };
    }, []);

    const removeCoupon = useCallback(() => setCoupon(null), []);

    const triggerFlyToCart = useCallback((rect) => {
        if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
        setFlyToCartAnimation(rect);
        flyTimerRef.current = setTimeout(() => {
            setFlyToCartAnimation(null);
            flyTimerRef.current = null;
        }, 800);
    }, []);

    const value = {
        cartItems,
        coupon,
        miniCartOpen,
        setMiniCartOpen,
        flyToCartAnimation,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getSubtotal,
        getItemCount,
        getShipping,
        getTax,
        getDiscount,
        getGrandTotal,
        applyCoupon,
        removeCoupon,
        triggerFlyToCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};