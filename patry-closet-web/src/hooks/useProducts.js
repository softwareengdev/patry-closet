import { useQuery } from '@tanstack/react-query';
import {
    getProducts,
    getProductBySlug,
    getFeaturedProducts,
    getRelatedProducts,
    getCategories,
} from '../lib/productsApi';

const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

/**
 * Paginated + filtered product list.
 * Uses keepPreviousData so UI doesn't flash on page/filter changes.
 */
export function useProducts(filters = {}) {
    return useQuery({
        queryKey: ['products', filters],
        queryFn: () => getProducts(filters),
        staleTime: FIVE_MINUTES,
        gcTime: TEN_MINUTES,
        placeholderData: (prev) => prev,
        retry: 1,
    });
}

/**
 * Single product detail by slug.
 */
export function useProduct(slug) {
    return useQuery({
        queryKey: ['product', slug],
        queryFn: () => getProductBySlug(slug),
        enabled: !!slug,
        staleTime: FIVE_MINUTES,
        gcTime: TEN_MINUTES,
        retry: 1,
    });
}

/**
 * Featured products for hero / homepage sections.
 */
export function useFeaturedProducts(count = 12) {
    return useQuery({
        queryKey: ['products', 'featured', count],
        queryFn: () => getFeaturedProducts(count),
        staleTime: FIVE_MINUTES,
        gcTime: TEN_MINUTES,
        retry: 1,
    });
}

/**
 * Related products for a given product id.
 */
export function useRelatedProducts(id, count = 8) {
    return useQuery({
        queryKey: ['products', 'related', id, count],
        queryFn: () => getRelatedProducts(id, count),
        enabled: !!id,
        staleTime: FIVE_MINUTES,
        gcTime: TEN_MINUTES,
        retry: 1,
    });
}

/**
 * Category tree for navigation / filters.
 */
export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
        staleTime: TEN_MINUTES,
        gcTime: 30 * 60 * 1000,
        retry: 1,
    });
}
