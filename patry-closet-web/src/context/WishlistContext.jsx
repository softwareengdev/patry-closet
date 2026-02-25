import { createContext, useState, useEffect } from 'react';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('wishlist');
        if (saved) setWishlistItems(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    const toggleWishlist = (product) => {
        setWishlistItems(prev =>
            prev.find(p => p.id === product.id)
                ? prev.filter(p => p.id !== product.id)
                : [...prev, product]
        );
    };

    const isInWishlist = (id) => wishlistItems.some(p => p.id === id);

    return (
        <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};