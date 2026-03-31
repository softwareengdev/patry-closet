import { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import authService from '../lib/authService';

export const WishlistContext = createContext();

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [stockNotifications, setStockNotifications] = useState(new Set());
    const [isMerging, setIsMerging] = useState(false);
    const hasMergedRef = useRef(false);

    // Load wishlist and stock notifications from localStorage on mount
    useEffect(() => {
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) setWishlistItems(JSON.parse(savedWishlist));

        const savedNotifications = localStorage.getItem('stockNotifications');
        if (savedNotifications) setStockNotifications(new Set(JSON.parse(savedNotifications)));
    }, []);

    // Persist wishlist to localStorage
    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    // Persist stock notifications to localStorage
    useEffect(() => {
        localStorage.setItem('stockNotifications', JSON.stringify([...stockNotifications]));
    }, [stockNotifications]);

    /* ─── Merge server wishlist on login ─── */
    const mergeServerWishlist = useCallback(async () => {
        if (hasMergedRef.current) return;
        setIsMerging(true);
        try {
            const serverItems = await authService.getServerWishlist();
            if (serverItems && serverItems.length > 0) {
                setWishlistItems(prev => {
                    const merged = [...prev];
                    for (const serverItem of serverItems) {
                        if (!merged.find(p => p.id === serverItem.id)) {
                            merged.push(serverItem);
                        }
                    }
                    return merged;
                });
            }
            hasMergedRef.current = true;
            // Sync merged result to server
            const currentItems = JSON.parse(localStorage.getItem('wishlist') || '[]');
            await authService.syncWishlist(currentItems).catch(() => {});
        } catch {
            // Server unavailable — keep local wishlist
        } finally {
            setIsMerging(false);
        }
    }, []);

    /* ─── Listen for auth events ─── */
    useEffect(() => {
        const handleLogin = () => {
            hasMergedRef.current = false;
            mergeServerWishlist();
        };
        const handleLogout = () => {
            hasMergedRef.current = false;
            // Keep local wishlist for guest browsing continuity
        };

        window.addEventListener('auth:login', handleLogin);
        window.addEventListener('auth:logout', handleLogout);
        return () => {
            window.removeEventListener('auth:login', handleLogin);
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, [mergeServerWishlist]);

    const toggleWishlist = useCallback((product) => {
        setWishlistItems(prev =>
            prev.find(p => p.id === product.id)
                ? prev.filter(p => p.id !== product.id)
                : [...prev, product]
        );
    }, []);

    const isInWishlist = useCallback((id) => {
        return wishlistItems.some(p => p.id === id);
    }, [wishlistItems]);

    const removeFromWishlist = useCallback((id) => {
        setWishlistItems(prev => prev.filter(p => p.id !== id));
    }, []);

    const moveToCart = useCallback((product, size, color, addToCartFn) => {
        addToCartFn(product, size, color);
        setWishlistItems(prev => prev.filter(p => p.id !== product.id));
    }, []);

    const clearWishlist = useCallback(() => {
        setWishlistItems([]);
    }, []);

    const getShareableLink = useCallback(() => {
        const ids = wishlistItems.map(p => p.id);
        const encoded = btoa(JSON.stringify(ids));
        return `${window.location.origin}/wishlist?shared=${encoded}`;
    }, [wishlistItems]);

    const loadSharedWishlist = useCallback((encodedIds, allProducts) => {
        try {
            const ids = JSON.parse(atob(encodedIds));
            const sharedProducts = allProducts.filter(p => ids.includes(p.id));
            setWishlistItems(sharedProducts);
        } catch {
            console.error('Failed to load shared wishlist: invalid encoded data');
        }
    }, []);

    const requestStockNotification = useCallback(async (productId) => {
        if (!('Notification' in window)) {
            return { success: false, message: 'Browser does not support notifications' };
        }

        let permission = Notification.permission;
        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
            return { success: false, message: 'Notification permission denied' };
        }

        setStockNotifications(prev => {
            const next = new Set(prev);
            next.add(productId);
            return next;
        });

        return { success: true, message: 'You will be notified when this item is back in stock' };
    }, []);

    const checkStockAndNotify = useCallback((products) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const notifiedIds = [];

        stockNotifications.forEach(productId => {
            const product = products.find(p => p.id === productId);
            if (product && product.inStock) {
                new Notification('Item Back in Stock!', {
                    body: `${product.name || product.title || 'A wishlist item'} is now available.`,
                });
                notifiedIds.push(productId);
            }
        });

        if (notifiedIds.length > 0) {
            setStockNotifications(prev => {
                const next = new Set(prev);
                notifiedIds.forEach(id => next.delete(id));
                return next;
            });
        }
    }, [stockNotifications]);

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            stockNotifications,
            isMerging,
            toggleWishlist,
            isInWishlist,
            removeFromWishlist,
            moveToCart,
            clearWishlist,
            getShareableLink,
            loadSharedWishlist,
            requestStockNotification,
            checkStockAndNotify,
        }}>
            {children}
        </WishlistContext.Provider>
    );
};