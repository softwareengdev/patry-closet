/**
 * Preload route chunks on link hover to eliminate loading delay.
 */
const preloadedRoutes = new Set();

const routeImports = {
    '/products': () => import('../components/ProductsPage'),
    '/cart': () => import('../components/Cart'),
    '/wishlist': () => import('../components/WishlistPage'),
    '/checkout': () => import('../components/Checkout'),
    '/login': () => import('../pages/LoginPage'),
    '/register': () => import('../pages/RegisterPage'),
    '/account': () => import('../pages/AccountPage'),
};

export function preloadRoute(path) {
    const base = '/' + (path.split('/')[1] || '');
    if (preloadedRoutes.has(base)) return;

    const loader = routeImports[base];
    if (loader) {
        preloadedRoutes.add(base);
        loader();
    }
}

export function preloadProductDetail() {
    if (preloadedRoutes.has('/products/:id')) return;
    preloadedRoutes.add('/products/:id');
    import('../components/ProductDetail');
}
