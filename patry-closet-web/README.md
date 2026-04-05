# PATRY♡CLOSET — Frontend

Premium fashion e-commerce SPA built with React 18, Vite 5, and Tailwind CSS.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18.3 + Vite 5 |
| Styling | Tailwind CSS 3.4 (warm luxury palette) |
| State | React Query 5 (server) + Context API (client) |
| Routing | React Router 6 |
| Forms | React Hook Form + Zod validation |
| Animations | Framer Motion |
| Payments | Stripe.js + React Stripe |
| i18n | i18next (ES/EN) |
| SEO | React Helmet Async + JSON-LD schemas |
| Analytics | Google Analytics 4 (GDPR-compliant) |
| PWA | Workbox + vite-plugin-pwa |
| Icons | Lucide React |

## Quick Start

```bash
# Prerequisites: Node.js 20+

# Install dependencies (--legacy-peer-deps required)
npm install --legacy-peer-deps

# Development server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/           # UI components
│   ├── account/          # Account dashboard tabs
│   ├── auth/             # Protected route, auth components
│   ├── Navbar.jsx        # Main navigation
│   ├── HeroSection.jsx   # Landing hero
│   ├── FeaturedProducts  # Featured product grid
│   ├── ProductsPage.jsx  # Catalog with filters
│   ├── ProductDetail.jsx # Product detail page
│   ├── Cart.jsx          # Cart sidebar + page
│   ├── Checkout.jsx      # Stripe checkout flow
│   ├── WishlistPage.jsx  # Wishlist management
│   ├── ErrorBoundary.jsx # Error boundary wrapper
│   └── SEOHead.jsx       # SEO + JSON-LD schemas
├── context/              # React contexts
│   ├── AuthContext.jsx    # Auth state + JWT management
│   ├── CartContext.jsx    # Cart state + server sync
│   └── WishlistContext.jsx
├── hooks/                # React Query hooks
│   └── useProducts.js    # Product data hooks
├── lib/                  # API services
│   ├── api.js            # Axios instance + JWT interceptors
│   ├── authService.js    # Hybrid auth (real API + mock fallback)
│   ├── productsApi.js    # Products API + mock fallback
│   ├── cartApi.js        # Cart API
│   ├── wishlistApi.js    # Wishlist API
│   ├── paymentsApi.js    # Stripe payments API
│   ├── addressesApi.js   # Shipping addresses API
│   └── analytics.js      # GA4 integration
├── data/                 # Mock data (offline fallback)
│   └── products.js       # 60 mock products + COLOR_MAP
├── pages/                # Route pages
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── AccountPage.jsx
│   ├── BlogPage.jsx
│   └── ...
├── i18n/                 # Translations
│   ├── es.json           # Spanish
│   └── en.json           # English
├── App.jsx               # Routes + layout
└── main.jsx              # Entry point + providers
```

## API Integration

All API services follow a **hybrid pattern**: real backend first, mock fallback when unavailable.

```js
// Example: productsApi.js
try {
    const { data } = await api.get('/v1/products');
    return data.data.map(normalizeProduct);
} catch {
    return mockProducts; // Graceful offline fallback
}
```

React Query hooks handle caching, deduplication, and background refetching:

```js
import { useProducts, useFeaturedProducts } from './hooks/useProducts';

const { data, isLoading } = useProducts({ category: 'Mujeres', page: 1 });
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5200/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Test key |
| `VITE_USE_MOCK_AUTH` | Force mock auth mode | `false` |
| `VITE_GA4_ID` | Google Analytics 4 ID | — |

## Design System

- **Color palette**: Warm tones (`bg-warm-50` to `bg-warm-400`) with dark mode support
- **Typography**: Serif headings, sans-serif body
- **Components**: Luxury fashion aesthetic — clean lines, generous whitespace
- **Logo**: PATRY♡CLOSET (consistent across all pages)
- **Responsive**: Mobile-first, 4-column grid on desktop

## SEO

- JSON-LD schemas: Organization, WebSite, Product, FAQ, Breadcrumb, ItemList
- Open Graph + Twitter Card meta tags
- Dynamic sitemap.xml + robots.txt
- Canonical URLs on all pages

## Build

```bash
npm run build
# Output: dist/ (ready for Cloudflare Pages or any static host)
# Deployed to: patrycloset.pages.dev
```

