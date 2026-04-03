/**
 * Google Analytics 4 — Utility module
 * Centralizes all GA4 tracking logic for Patry Closet.
 *
 * SETUP: Replace 'G-XXXXXXXXXX' with your real GA4 Measurement ID
 * from https://analytics.google.com → Admin → Data Streams → Web
 */
import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA4_ID || 'G-V49X3BNK9P';

let isInitialized = false;

export function initGA4() {
    if (isInitialized || typeof window === 'undefined') return;

    const consent = localStorage.getItem('cookie-consent');
    if (consent === 'denied') return;

    ReactGA.initialize(GA_MEASUREMENT_ID, {
        gaOptions: {
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure',
        },
        gtagOptions: {
            send_page_view: false, // we track manually via usePageTracking
        },
    });
    isInitialized = true;
}

export function isGA4Ready() {
    return isInitialized;
}

// ─── Page Views ───
export function trackPageView(path, title) {
    if (!isInitialized) return;
    ReactGA.send({
        hitType: 'pageview',
        page: path,
        title: title || document.title,
    });
}

// ─── Custom Events ───
export function trackEvent(action, category, label, value) {
    if (!isInitialized) return;
    ReactGA.event({ action, category, label, value });
}

// ─── Ecommerce: Enhanced Measurement ───
export function trackViewItem(product) {
    if (!isInitialized) return;
    ReactGA.gtag('event', 'view_item', {
        currency: 'EUR',
        value: product.price,
        items: [{
            item_id: String(product.id),
            item_name: product.name,
            item_category: product.category,
            item_brand: product.brand || 'Patry Closet',
            price: product.price,
            discount: product.discount || 0,
        }],
    });
}

export function trackAddToCart(product, quantity = 1) {
    if (!isInitialized) return;
    ReactGA.gtag('event', 'add_to_cart', {
        currency: 'EUR',
        value: product.price * quantity,
        items: [{
            item_id: String(product.id),
            item_name: product.name,
            item_category: product.category,
            item_brand: product.brand || 'Patry Closet',
            price: product.price,
            quantity,
        }],
    });
}

export function trackRemoveFromCart(product, quantity = 1) {
    if (!isInitialized) return;
    ReactGA.gtag('event', 'remove_from_cart', {
        currency: 'EUR',
        value: product.price * quantity,
        items: [{
            item_id: String(product.id),
            item_name: product.name,
            price: product.price,
            quantity,
        }],
    });
}

export function trackBeginCheckout(items, totalValue) {
    if (!isInitialized) return;
    ReactGA.gtag('event', 'begin_checkout', {
        currency: 'EUR',
        value: totalValue,
        items: items.map(item => ({
            item_id: String(item.id),
            item_name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
        })),
    });
}

export function trackPurchase(transactionId, items, totalValue) {
    if (!isInitialized) return;
    ReactGA.gtag('event', 'purchase', {
        transaction_id: transactionId,
        currency: 'EUR',
        value: totalValue,
        items: items.map(item => ({
            item_id: String(item.id),
            item_name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
        })),
    });
}

export function trackViewItemList(listName, products) {
    if (!isInitialized) return;
    ReactGA.gtag('event', 'view_item_list', {
        item_list_name: listName,
        items: products.slice(0, 10).map((p, i) => ({
            item_id: String(p.id),
            item_name: p.name,
            item_category: p.category,
            price: p.price,
            index: i,
        })),
    });
}

export function trackSearch(searchTerm) {
    if (!isInitialized) return;
    ReactGA.gtag('event', 'search', { search_term: searchTerm });
}

export function trackSignUp(method = 'email') {
    if (!isInitialized) return;
    ReactGA.gtag('event', 'sign_up', { method });
}

export function trackLogin(method = 'email') {
    if (!isInitialized) return;
    ReactGA.gtag('event', 'login', { method });
}
