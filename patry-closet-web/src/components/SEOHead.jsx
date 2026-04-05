import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://patrycloset.com';
const SITE_NAME = 'PATRY♡CLOSET';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_DESCRIPTION = 'PATRY♡CLOSET — Tienda de moda online con colecciones exclusivas de ropa de mujer, hombre y accesorios. Vestidos, tops, pantalones, bolsos y zapatos de las últimas tendencias. Envío gratuito en pedidos +50€. Tu destino de moda premium en España.';
const INSTAGRAM_URL = 'https://www.instagram.com/patriiiii93/';

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
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Tienda de Moda Online | Ropa Mujer, Hombre y Accesorios`;
    const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content="patry closet, moda online, tienda ropa online, ropa mujer, vestidos, tops, pantalones, faldas, abrigos, zapatos mujer, bolsos, accesorios moda, ropa hombre, moda española, comprar ropa online, tendencias moda 2026, colecciones exclusivas, moda sostenible, envío gratis, fashion store Spain, desfiles de moda, estilo mujer, outfits, streetwear, ropa elegante, moda premium, nueva colección, rebajas moda" />
            {noindex && <meta name="robots" content="noindex,nofollow" />}
            {!noindex && <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />}
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

            {/* Open Graph */}
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={type} />
            <meta property="og:image" content={image} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="PATRY♡CLOSET — Moda online exclusiva" />
            {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
            <meta property="og:locale" content="es_ES" />
            <meta property="og:locale:alternate" content="en_US" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            <meta name="twitter:site" content="@patrycloset" />
            <meta name="twitter:creator" content="@patrycloset" />

            {/* Instagram / Pinterest verification */}
            <meta property="article:author" content={INSTAGRAM_URL} />
            <meta property="instagram:creator" content="patriiiii93" />

            {/* Geo targeting Spain */}
            <meta name="geo.region" content="ES" />
            <meta name="geo.placename" content="Madrid, España" />
            <meta name="geo.position" content="40.4168;-3.7038" />
            <meta name="ICBM" content="40.4168, -3.7038" />
            <meta name="content-language" content="es, en" />

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
        '@type': 'ClothingStore',
        '@id': `${SITE_URL}/#organization`,
        name: 'Patry Closet',
        alternateName: 'PATRY♡CLOSET',
        url: SITE_URL,
        logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/pwa-512x512.png`,
            width: 512,
            height: 512,
        },
        image: DEFAULT_IMAGE,
        description: 'Tienda de moda online premium con colecciones exclusivas de ropa de mujer, hombre y accesorios. Vestidos, tops, pantalones, bolsos, zapatos y joyería de las últimas tendencias. Envío gratuito en pedidos superiores a 50€.',
        slogan: 'Tu destino de moda premium',
        foundingDate: '2024',
        founder: {
            '@type': 'Person',
            name: 'Patricia',
            url: INSTAGRAM_URL,
            sameAs: [INSTAGRAM_URL],
        },
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Gran Vía 42',
            addressLocality: 'Madrid',
            postalCode: '28013',
            addressRegion: 'Comunidad de Madrid',
            addressCountry: 'ES',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 40.4200,
            longitude: -3.7025,
        },
        telephone: '+34912345678',
        email: 'info@patrycloset.com',
        priceRange: '€€',
        currenciesAccepted: 'EUR',
        paymentAccepted: 'Visa, Mastercard, PayPal, Apple Pay, Stripe',
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '00:00',
            closes: '23:59',
        },
        sameAs: [
            INSTAGRAM_URL,
            'https://facebook.com/patrycloset',
            'https://tiktok.com/@patrycloset',
            'https://pinterest.com/patrycloset',
        ],
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Catálogo de Moda Patry Closet',
            itemListElement: [
                {
                    '@type': 'OfferCatalog',
                    name: 'Ropa de Mujer',
                    itemListElement: [
                        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Vestidos' } },
                        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Tops y Blusas' } },
                        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Pantalones' } },
                        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Faldas' } },
                        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Abrigos y Chaquetas' } },
                    ],
                },
                {
                    '@type': 'OfferCatalog',
                    name: 'Accesorios',
                    itemListElement: [
                        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Bolsos' } },
                        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Zapatos' } },
                        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Joyería' } },
                    ],
                },
            ],
        },
        contactPoint: [
            {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                telephone: '+34912345678',
                email: 'info@patrycloset.com',
                availableLanguage: ['Spanish', 'English'],
                areaServed: ['ES', 'EU'],
            },
            {
                '@type': 'ContactPoint',
                contactType: 'sales',
                url: INSTAGRAM_URL,
                availableLanguage: ['Spanish', 'English'],
            },
        ],
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '1247',
            bestRating: '5',
            worstRating: '1',
        },
    };
}

export function getWebSiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        alternateName: ['Patry Closet', 'PatryCloset', 'patrycloset.com'],
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: ['es-ES', 'en-US'],
        potentialAction: [
            {
                '@type': 'SearchAction',
                target: {
                    '@type': 'EntryPoint',
                    urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
            },
            {
                '@type': 'ReadAction',
                target: `${SITE_URL}/blog`,
            },
        ],
    };
}

export function getLocalBusinessSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#localbusiness`,
        name: 'Patry Closet',
        image: DEFAULT_IMAGE,
        url: SITE_URL,
        telephone: '+34912345678',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Gran Vía 42',
            addressLocality: 'Madrid',
            postalCode: '28013',
            addressCountry: 'ES',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 40.4200,
            longitude: -3.7025,
        },
        priceRange: '€€',
        sameAs: [INSTAGRAM_URL, 'https://facebook.com/patrycloset', 'https://tiktok.com/@patrycloset'],
    };
}

export function getBrandSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Brand',
        '@id': `${SITE_URL}/#brand`,
        name: 'Patry Closet',
        alternateName: 'PATRY♡CLOSET',
        url: SITE_URL,
        logo: `${SITE_URL}/pwa-512x512.png`,
        slogan: 'Tu destino de moda premium',
        description: 'Marca de moda española con colecciones exclusivas para mujer y hombre. Estilo premium, elegante y contemporáneo.',
        sameAs: [INSTAGRAM_URL],
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
            url: 'https://patrycloset.com',
        },
        sku: `PC-${product.id}`,
        mpn: `PATRY-${product.id}`,
        category: product.category || 'Ropa',
        color: product.color || undefined,
        material: product.material || undefined,
        audience: {
            '@type': 'PeopleAudience',
            suggestedGender: product.gender || 'female',
        },
        offers: {
            '@type': 'Offer',
            url: `${SITE_URL}/products/${product.id}`,
            priceCurrency: 'EUR',
            price: product.discount
                ? (product.price * (1 - product.discount / 100)).toFixed(2)
                : product.price.toFixed(2),
            ...(product.discount && {
                priceSpecification: {
                    '@type': 'PriceSpecification',
                    price: product.price.toFixed(2),
                    priceCurrency: 'EUR',
                    valueAddedTaxIncluded: true,
                },
            }),
            availability: product.inStock !== false
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            shippingDetails: {
                '@type': 'OfferShippingDetails',
                shippingRate: {
                    '@type': 'MonetaryAmount',
                    value: '0',
                    currency: 'EUR',
                },
                shippingDestination: {
                    '@type': 'DefinedRegion',
                    addressCountry: 'ES',
                },
                deliveryTime: {
                    '@type': 'ShippingDeliveryTime',
                    handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
                    transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
                },
            },
            hasMerchantReturnPolicy: {
                '@type': 'MerchantReturnPolicy',
                returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
                merchantReturnDays: 30,
                returnMethod: 'https://schema.org/ReturnByMail',
                returnFees: 'https://schema.org/FreeReturn',
            },
            seller: {
                '@type': 'Organization',
                name: 'Patry Closet',
                url: SITE_URL,
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

export function getCollectionPageSchema(collectionName, description, products) {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: collectionName,
        description,
        url: `${SITE_URL}/products`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: {
            '@type': 'Thing',
            name: 'Moda y Ropa',
        },
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: products.length,
            itemListElement: products.slice(0, 50).map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${SITE_URL}/products/${p.id}`,
                name: p.name,
                image: p.images?.[0] || p.image,
            })),
        },
    };
}

export function getBlogPostSchema(post) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt || post.description,
        image: post.image,
        datePublished: post.date,
        dateModified: post.updatedDate || post.date,
        author: {
            '@type': 'Person',
            name: post.author || 'Patricia',
            url: INSTAGRAM_URL,
        },
        publisher: { '@id': `${SITE_URL}/#organization` },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/blog/${post.slug || post.id}`,
        },
        keywords: post.tags?.join(', ') || 'moda, tendencias, estilo',
    };
}

export function getPersonSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Patricia',
        alternateName: 'patriiiii93',
        url: INSTAGRAM_URL,
        sameAs: [INSTAGRAM_URL],
        jobTitle: 'Fundadora & Directora Creativa',
        worksFor: { '@id': `${SITE_URL}/#organization` },
        knowsAbout: ['Moda', 'Estilismo', 'Tendencias', 'Diseño de Moda', 'E-commerce'],
    };
}
