import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';

const ROUTE_TITLES = {
    '/': 'Inicio — PATRY♡CLOSET',
    '/products': 'Productos — PATRY♡CLOSET',
    '/cart': 'Carrito — PATRY♡CLOSET',
    '/wishlist': 'Wishlist — PATRY♡CLOSET',
    '/checkout': 'Checkout — PATRY♡CLOSET',
    '/blog': 'Blog — PATRY♡CLOSET',
    '/login': 'Iniciar Sesión — PATRY♡CLOSET',
    '/register': 'Crear Cuenta — PATRY♡CLOSET',
    '/forgot-password': 'Recuperar Contraseña — PATRY♡CLOSET',
    '/terms': 'Términos y Condiciones — PATRY♡CLOSET',
    '/privacy': 'Política de Privacidad — PATRY♡CLOSET',
    '/cookies': 'Política de Cookies — PATRY♡CLOSET',
    '/faq': 'FAQ — PATRY♡CLOSET',
    '/account': 'Mi Cuenta — PATRY♡CLOSET',
};

export default function usePageTracking() {
    const location = useLocation();

    useEffect(() => {
        const title = ROUTE_TITLES[location.pathname] || `PATRY♡CLOSET`;
        trackPageView(location.pathname + location.search, title);
    }, [location.pathname, location.search]);
}
