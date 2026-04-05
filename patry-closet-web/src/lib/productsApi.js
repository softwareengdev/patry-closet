/**
 * Products API Service
 * Handles product-related API calls with mock fallback.
 */
import api from './api';
import { mockProducts } from '../data/products';

/* ─── Normalizer ─── */

/**
 * Maps backend ProductListDto / ProductDetailDto → frontend product shape.
 * Keeps all backend fields; renames divergent ones for frontend compatibility.
 */
export function normalizeProduct(dto) {
    if (!dto) return dto;

    const product = {
        // 1:1 mappings
        id: dto.id,
        name: dto.name,
        slug: dto.slug,
        price: dto.price,
        originalPrice: dto.originalPrice ?? null,
        brand: dto.brand,
        badge: dto.badge ?? null,
        rating: dto.rating,
        reviewCount: dto.reviewCount,
        popularity: dto.popularity,
        category: dto.category,
        subcategory: dto.subcategory,
        image: dto.image,
        hoverImage: dto.hoverImage,
        colors: dto.colors ?? [],
        sizes: dto.sizes ?? [],
        inStock: dto.inStock,
        isFeatured: dto.isFeatured,

        // Renamed field
        discount: dto.discountPercent ?? 0,

        // images: flatten for list compatibility, keep full array for detail
        images: Array.isArray(dto.images)
            ? dto.images
                  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                  .map((img) => (typeof img === 'string' ? img : img.url))
            : [],
        // Preserve full image objects for detail views
        _rawImages: dto.images ?? [],
    };

    // Detail-specific fields (only present on ProductDetailDto)
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.material !== undefined) product.material = dto.material;
    if (dto.gender !== undefined) product.gender = dto.gender;
    if (dto.categorySlug !== undefined) product.categorySlug = dto.categorySlug;
    if (dto.variants !== undefined) product.variants = dto.variants;
    if (dto.availableColors !== undefined) product.availableColors = dto.availableColors;
    if (dto.availableSizes !== undefined) product.availableSizes = dto.availableSizes;
    if (dto.recentReviews !== undefined) product.recentReviews = dto.recentReviews;
    if (dto.createdAt !== undefined) product.createdAt = dto.createdAt;

    return product;
}

/* ─── Mock fallback helpers ─── */

function applyMockFilters(products, filters = {}) {
    let result = [...products];

    const {
        search,
        category,
        subcategory,
        brand,
        color,
        size,
        badge,
        minPrice,
        maxPrice,
        inStock,
        isFeatured,
        sortBy = 'popularity',
        sortDirection = 'desc',
        page = 1,
        pageSize = 20,
    } = filters;

    if (search) {
        const q = search.toLowerCase();
        result = result.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.brand?.toLowerCase().includes(q)
        );
    }
    if (category) result = result.filter((p) => p.category === category);
    if (subcategory) result = result.filter((p) => p.subcategory === subcategory);
    if (brand) result = result.filter((p) => p.brand === brand);
    if (color) result = result.filter((p) => p.colors?.includes(color));
    if (size) result = result.filter((p) => p.sizes?.includes(size));
    if (badge) result = result.filter((p) => p.badge === badge);
    if (minPrice != null) result = result.filter((p) => p.price >= Number(minPrice));
    if (maxPrice != null) result = result.filter((p) => p.price <= Number(maxPrice));
    if (inStock != null) result = result.filter((p) => p.inStock === (inStock === true || inStock === 'true'));
    if (isFeatured != null) result = result.filter((p) => p.isFeatured === (isFeatured === true || isFeatured === 'true'));

    // Sort
    const dir = sortDirection === 'asc' ? 1 : -1;
    const key = sortBy === 'price' ? 'price' : sortBy === 'name' ? 'name' : 'popularity';
    result.sort((a, b) => {
        if (key === 'name') return dir * a.name.localeCompare(b.name);
        return dir * ((a[key] ?? 0) - (b[key] ?? 0));
    });

    // Paginate
    const totalCount = result.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const start = (currentPage - 1) * pageSize;
    const items = result.slice(start, start + pageSize);

    return {
        data: items,
        pagination: {
            currentPage,
            totalPages,
            pageSize,
            totalCount,
            hasPrevious: currentPage > 1,
            hasNext: currentPage < totalPages,
        },
    };
}

/* ─── API functions ─── */

/**
 * Fetch paginated, filtered product list.
 */
export async function getProducts(filters = {}) {
    try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value != null && value !== '') params.set(key, String(value));
        });

        const { data } = await api.get(`/v1/products?${params.toString()}`);
        return {
            data: (data.data ?? []).map(normalizeProduct),
            pagination: data.pagination,
        };
    } catch {
        console.warn('[productsApi] Backend unavailable — using mock data');
        const mock = applyMockFilters(mockProducts, filters);
        return { data: mock.data, pagination: mock.pagination };
    }
}

/**
 * Fetch a single product by slug.
 */
export async function getProductBySlug(slug) {
    try {
        const { data } = await api.get(`/v1/products/${encodeURIComponent(slug)}`);
        return normalizeProduct(data.data);
    } catch {
        console.warn('[productsApi] Backend unavailable — using mock data for slug:', slug);
        // Mock products don't have slugs; try matching by lowered name
        const match = mockProducts.find(
            (p) =>
                p.name.toLowerCase().replace(/\s+/g, '-') === slug ||
                String(p.id) === slug
        );
        return match ?? null;
    }
}

/**
 * Fetch featured products.
 */
export async function getFeaturedProducts(count = 12) {
    try {
        const { data } = await api.get(`/v1/products/featured`, { params: { count } });
        return (data.data ?? []).map(normalizeProduct);
    } catch {
        console.warn('[productsApi] Backend unavailable — using mock featured');
        return mockProducts
            .filter((p) => p.badge === 'bestSeller' || p.badge === 'new')
            .slice(0, count);
    }
}

/**
 * Fetch related products for a given product id.
 */
export async function getRelatedProducts(id, count = 8) {
    try {
        const { data } = await api.get(`/v1/products/${id}/related`, { params: { count } });
        return (data.data ?? []).map(normalizeProduct);
    } catch {
        console.warn('[productsApi] Backend unavailable — using mock related');
        const source = mockProducts.find((p) => String(p.id) === String(id));
        if (!source) return mockProducts.slice(0, count);
        return mockProducts
            .filter((p) => p.id !== source.id && p.category === source.category)
            .slice(0, count);
    }
}

/**
 * Fetch the category tree.
 */
export async function getCategories() {
    try {
        const { data } = await api.get('/v1/categories');
        return data.data;
    } catch {
        console.warn('[productsApi] Backend unavailable — using mock categories');
        const cats = new Map();
        mockProducts.forEach((p) => {
            if (!cats.has(p.category)) cats.set(p.category, new Set());
            if (p.subcategory) cats.get(p.category).add(p.subcategory);
        });
        return Array.from(cats.entries()).map(([name, subs]) => ({
            name,
            subcategories: Array.from(subs).map((s) => ({ name: s })),
        }));
    }
}

const productsApi = {
    getProducts,
    getProductBySlug,
    getFeaturedProducts,
    getRelatedProducts,
    getCategories,
    normalizeProduct,
};

export default productsApi;
