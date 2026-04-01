import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  blogPosts,
  getPostBySlug,
  getRelatedPosts,
  getFeaturedPosts,
  BLOG_CATEGORIES,
  BLOG_SEASONS,
} from '../data/blogPosts';

// Simulate network latency for realistic UX (will be replaced by real API)
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch paginated + filtered blog posts.
 * Supports: category, season, tag, search query, sort, pagination.
 */
async function fetchBlogPosts({ page = 1, perPage = 6, category, season, tag, query, sort = 'newest' }) {
  await delay(400);

  let filtered = [...blogPosts];

  if (category) filtered = filtered.filter(p => p.category === category);
  if (season) filtered = filtered.filter(p => p.season === season);
  if (tag) filtered = filtered.filter(p => p.tags.includes(tag));
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      p =>
        p.titleFallback.toLowerCase().includes(q) ||
        p.excerptFallback.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
    );
  }

  // Sort
  switch (sort) {
    case 'oldest':
      filtered.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
      break;
    case 'reading-time':
      filtered.sort((a, b) => a.readingTime - b.readingTime);
      break;
    case 'newest':
    default:
      filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      break;
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const items = filtered.slice(start, start + perPage);

  return {
    items,
    total,
    page,
    perPage,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : undefined,
  };
}

async function fetchBlogPost(slug) {
  await delay(250);
  return getPostBySlug(slug);
}

async function fetchRelatedPosts(postId) {
  await delay(200);
  return getRelatedPosts(postId, 3);
}

async function fetchFeaturedPosts() {
  await delay(200);
  return getFeaturedPosts();
}

// ─── HOOKS ───

export function useBlogPosts(filters = {}) {
  return useQuery({
    queryKey: ['blog-posts', filters],
    queryFn: () => fetchBlogPosts(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

/** Infinite scroll variant — loads pages as user scrolls */
export function useInfiniteBlogPosts(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['blog-posts-infinite', filters],
    queryFn: ({ pageParam = 1 }) => fetchBlogPosts({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlogPost(slug) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => fetchBlogPost(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRelatedPosts(postId) {
  return useQuery({
    queryKey: ['blog-related', postId],
    queryFn: () => fetchRelatedPosts(postId),
    enabled: !!postId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useFeaturedPosts() {
  return useQuery({
    queryKey: ['blog-featured'],
    queryFn: fetchFeaturedPosts,
    staleTime: 10 * 60 * 1000,
  });
}

export { BLOG_CATEGORIES, BLOG_SEASONS };
