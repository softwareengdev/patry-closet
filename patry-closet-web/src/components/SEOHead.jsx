import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://patrycloset.com';
const SITE_NAME = 'PATRY♡CLOSET';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_DESCRIPTION = 'Tienda de moda online con colecciones exclusivas para mujer, hombre y accesorios. Envío gratuito en pedidos +50€.';

export default function SEOHead({
    title,
    description = DEFAULT_DESCRIPTION,
    canonical,
    image = DEFAULT_IMAGE,
    type = 'website',
    noindex = false,
    jsonLd,
    children,
}) {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Fashion Store`;
    const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {noindex && <meta name="robots" content="noindex,nofollow" />}
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

            {/* Open Graph */}
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={type} />
            <meta property="og:image" content={image} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
            <meta property="og:locale" content="es_ES" />
            <meta property="og:locale:alternate" content="en_US" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* JSON-LD Structured Data */}
            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}

            {children}
        </Helmet>
    );
}

// ─── Reusable JSON-LD Schemas ───

export function getOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Patry Closet',
        url: SITE_URL,
        logo: `${SITE_URL}/pwa-512x512.png`,
        description: DEFAULT_DESCRIPTION,
        sameAs: [
            'https://instagram.com/patrycloset',
            'https://facebook.com/patrycloset',
            'https://tiktok.com/@patrycloset',
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            availableLanguage: ['Spanish', 'English'],
        },
    };
}

export function getWebSiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };
}

export function getProductSchema(product) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.images?.[0] || product.image,
        brand: {
            '@type': 'Brand',
            name: product.brand || 'Patry Closet',
        },
        sku: `PC-${product.id}`,
        offers: {
            '@type': 'Offer',
            url: `${SITE_URL}/products/${product.id}`,
            priceCurrency: 'EUR',
            price: product.discount
                ? (product.price * (1 - product.discount / 100)).toFixed(2)
                : product.price.toFixed(2),
            availability: product.inStock !== false
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            seller: {
                '@type': 'Organization',
                name: 'Patry Closet',
            },
        },
        ...(product.rating && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.reviewCount || 1,
                bestRating: 5,
                worstRating: 1,
            },
        }),
    };
}

export function getBreadcrumbSchema(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: item.url ? `${SITE_URL}${item.url}` : undefined,
        })),
    };
}

export function getItemListSchema(products, listName) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: listName,
        numberOfItems: products.length,
        itemListElement: products.slice(0, 30).map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/products/${p.id}`,
            name: p.name,
        })),
    };
}

export function getFAQSchema(faqs) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}
