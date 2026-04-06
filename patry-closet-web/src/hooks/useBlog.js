import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '../lib/api.js';
import {
  blogPosts,
  getPostBySlug,
  getRelatedPosts,
  getFeaturedPosts,
  BLOG_CATEGORIES,
  BLOG_SEASONS,
} from '../data/blogPosts';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));
let useMockBlog = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

// ─── Map backend post → frontend post shape ───
function mapBlogPost(post) {
  return {
    id: post.id,
    slug: post.slug,
    titleKey: null,
    titleFallback: post.titleFallback || post.title,
    excerptKey: null,
    excerptFallback: post.excerptFallback || post.excerpt,
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt,
    category: post.category,
    season: post.season,
    tags: post.tags || [],
    author: post.author ? {
      id: post.author.id,
      name: post.author.name,
      role: post.author.role,
      avatar: post.author.avatar,
    } : null,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    readingTime: post.readingTime,
    featured: post.featured,
    trending: post.trending,
    badge: post.badge,
    content: post.content,
    relatedProductIds: post.relatedProductIds || [],
  };
}

// ─── Mock fetch functions (kept as fallbacks) ───

async function fetchBlogPostsMock({ page = 1, perPage = 6, category, season, tag, query, sort = 'newest' }) {
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

async function fetchBlogPostMock(slug) {
  await delay(250);
  return getPostBySlug(slug);
}

async function fetchRelatedPostsMock(postId) {
  await delay(200);
  return getRelatedPosts(postId, 3);
}

async function fetchFeaturedPostsMock() {
  await delay(200);
  return getFeaturedPosts();
}

// ─── Real API fetch functions with mock fallback ───

async function fetchBlogPosts(params) {
  if (useMockBlog) return fetchBlogPostsMock(params);
  try {
    const { data: res } = await api.get('/v1/blog/posts', { params: {
      page: params.page || 1,
      perPage: params.perPage || 6,
      category: params.category || undefined,
      season: params.season || undefined,
      tag: params.tag || undefined,
      query: params.query || undefined,
      sort: params.sort || 'newest',
    }});
    const items = (res.data?.items ?? []).map(mapBlogPost);
    return {
      items,
      total: res.data?.total ?? items.length,
      page: res.data?.page ?? 1,
      perPage: res.data?.perPage ?? 6,
      totalPages: res.data?.totalPages ?? 1,
      hasNextPage: res.data?.hasNextPage ?? false,
      hasPrevPage: res.data?.hasPrevPage ?? false,
      nextPage: res.data?.nextPage,
    };
  } catch (err) {
    if (!err.response) {
      useMockBlog = true;
      console.warn('[useBlog] Backend unreachable — switching to mock mode');
    }
    return fetchBlogPostsMock(params);
  }
}

async function fetchBlogPost(slug) {
  if (useMockBlog) return fetchBlogPostMock(slug);
  try {
    const { data: res } = await api.get(`/v1/blog/posts/${slug}`);
    return mapBlogPost(res.data);
  } catch (err) {
    if (!err.response) {
      useMockBlog = true;
      console.warn('[useBlog] Backend unreachable — switching to mock mode');
    }
    return fetchBlogPostMock(slug);
  }
}

async function fetchRelatedPosts(postId) {
  if (useMockBlog) return fetchRelatedPostsMock(postId);
  try {
    const { data: res } = await api.get(`/v1/blog/posts/${postId}/related`, { params: { count: 3 } });
    return (res.data ?? []).map(mapBlogPost);
  } catch (err) {
    if (!err.response) {
      useMockBlog = true;
      console.warn('[useBlog] Backend unreachable — switching to mock mode');
    }
    return fetchRelatedPostsMock(postId);
  }
}

async function fetchFeaturedPosts() {
  if (useMockBlog) return fetchFeaturedPostsMock();
  try {
    const { data: res } = await api.get('/v1/blog/posts/featured');
    return (res.data ?? []).map(mapBlogPost);
  } catch (err) {
    if (!err.response) {
      useMockBlog = true;
      console.warn('[useBlog] Backend unreachable — switching to mock mode');
    }
    return fetchFeaturedPostsMock();
  }
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
