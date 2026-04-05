import { useState, useContext, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { BookOpen, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import BlogCard from '../components/blog/BlogCard';
import BlogFilters from '../components/blog/BlogFilters';
import BlogSidebar from '../components/blog/BlogSidebar';
import { useInfiniteBlogPosts, useFeaturedPosts } from '../hooks/useBlog';

const BlogPage = () => {
  const { t } = useTranslation();
  const { isDark } = useContext(ThemeContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const loadMoreRef = useRef(null);

  // Read filters from URL params
  const filters = useMemo(() => ({
    perPage: 6,
    category: searchParams.get('category') || '',
    season: searchParams.get('season') || '',
    tag: searchParams.get('tag') || '',
    query: searchParams.get('q') || '',
    sort: searchParams.get('sort') || 'newest',
  }), [searchParams]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteBlogPosts(filters);

  const { data: featuredPosts } = useFeaturedPosts();

  // Flatten paginated results into a single array
  const allPosts = useMemo(
    () => data?.pages?.flatMap(page => page.items) || [],
    [data]
  );
  const total = data?.pages?.[0]?.total || 0;

  // Sync filters to URL
  const handleFilterChange = useCallback((newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.season) params.set('season', newFilters.season);
    if (newFilters.tag) params.set('tag', newFilters.tag);
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.sort && newFilters.sort !== 'newest') params.set('sort', newFilters.sort);
    setSearchParams(params, { replace: true });
    // Scroll to grid on filter change
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }, [setSearchParams]);

  // Infinite scroll: IntersectionObserver on sentinel
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage();
      },
      { rootMargin: '400px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // GA4 analytics
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'blog_view', { category: filters.category });
    }
  }, [filters.category]);

  const heroPost = featuredPosts?.[0];

  return (
    <div className="min-h-screen bg-warm-200 dark:bg-gray-950 transition-colors">
      {/* ─── SEO META ─── */}
      <Helmet>
        <title>{t('blog.heroTitle', 'Style, Trends & Stories')} — Patry Closet</title>
        <meta name="description" content={t('blog.heroSubtitle', 'Discover the latest in fashion, sustainability, and the art of dressing well.')} />
        <link rel="canonical" href="https://patrycloset.com/blog" />
        <meta property="og:title" content={`${t('blog.heroTitle', 'Style, Trends & Stories')} — Patry Closet`} />
        <meta property="og:description" content={t('blog.heroSubtitle', 'Discover the latest in fashion, sustainability, and the art of dressing well.')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://patrycloset.com/blog" />
        {heroPost && <meta property="og:image" content={heroPost.coverImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Patry Closet Journal',
          description: t('blog.heroSubtitle', 'Discover the latest in fashion, sustainability, and the art of dressing well.'),
          url: 'https://patrycloset.com/blog',
          publisher: {
            '@type': 'Organization',
            name: 'Patry Closet',
            url: 'https://patrycloset.com',
          },
        })}</script>
      </Helmet>

      {/* ─── HERO SECTION ─── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-gray-900 text-white"
      >
        {heroPost && (
          <div className="absolute inset-0">
            <img
              src={heroPost.coverImage}
              alt=""
              className="w-full h-full object-cover opacity-30"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/80 to-gray-900" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-medium tracking-wider uppercase text-amber-300">
                {t('blog.journalBadge', 'Patry Closet Journal')}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light tracking-tight mb-4 leading-[1.1]">
              {t('blog.heroTitle', 'Style, Trends & Stories')}
            </h1>

            <p className="text-base sm:text-lg text-gray-300 max-w-lg leading-relaxed">
              {t('blog.heroSubtitle', 'Discover the latest in fashion, sustainability, and the art of dressing well.')}
            </p>
          </motion.div>

          {heroPost && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-10"
            >
              <Link
                to={`/blog/${heroPost.slug}`}
                className="group inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 p-4 pr-6 hover:bg-warm-50/10 transition-all"
              >
                <img
                  src={heroPost.coverImage}
                  alt={heroPost.coverImageAlt}
                  className="w-20 h-16 sm:w-28 sm:h-20 object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {t('blog.featuredPost', 'Featured')}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {t(heroPost.titleKey, heroPost.titleFallback)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                    {heroPost.author.name} · {heroPost.readingTime} {t('blog.minRead', 'min read')}
                  </p>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8"
        >
          <BlogFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            totalResults={total}
            isOpen={filtersOpen}
            onToggle={() => setFiltersOpen(o => !o)}
          />
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* ─── Article Grid ─── */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <BlogGridSkeleton />
            ) : allPosts.length === 0 ? (
              <EmptyState t={t} isDark={isDark} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {allPosts.map((post, i) => (
                    <BlogCard
                      key={post.id}
                      post={post}
                      index={i}
                      variant={i === 0 && !filters.category ? 'featured' : 'default'}
                    />
                  ))}
                </div>

                {/* Infinite scroll sentinel + loading */}
                <div ref={loadMoreRef} className="mt-8 flex flex-col items-center gap-3">
                  {isFetchingNextPage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-sm text-gray-400"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('blog.loadingMore', 'Loading more articles...')}
                    </motion.div>
                  )}

                  {/* Manual load more button (fallback + accessibility) */}
                  {hasNextPage && !isFetchingNextPage && (
                    <button
                      onClick={() => fetchNextPage()}
                      className={`px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all
                        ${isDark
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-750 hover:text-white border border-gray-700'
                          : 'bg-warm-50 text-gray-700 hover:bg-warm-200 hover:text-gray-900 border border-warm-400'
                        }`}
                    >
                      {t('blog.loadMore', 'Load More Articles')}
                    </button>
                  )}

                  {/* End of results */}
                  {!hasNextPage && allPosts.length > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-600">
                      {t('blog.endOfResults', 'You\'ve reached the end')} · {total} {t('blog.articles', 'articles')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ─── Sidebar (desktop) ─── */}
          <div className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
            <BlogSidebar currentFilters={filters} onFilterChange={handleFilterChange} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── SKELETON GRID ───
const BlogGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className={`overflow-hidden border border-warm-300 dark:border-gray-800 ${i === 0 ? 'sm:col-span-2 sm:grid sm:grid-cols-2' : ''}`}>
        <div className={`bg-warm-400 dark:bg-gray-800 animate-pulse ${i === 0 ? 'aspect-auto min-h-[200px]' : 'aspect-[16/10]'}`} />
        <div className="p-5 space-y-3">
          <div className="flex gap-2">
            <div className="h-3 w-16 bg-warm-400 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3 w-12 bg-warm-400 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="h-4 w-3/4 bg-warm-400 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-3 w-full bg-warm-400 dark:bg-gray-800 rounded animate-pulse" />
          <div className="flex items-center gap-2 pt-2">
            <div className="w-7 h-7 rounded-full bg-warm-400 dark:bg-gray-800 animate-pulse" />
            <div className="h-3 w-20 bg-warm-400 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ─── EMPTY STATE ───
const EmptyState = ({ t, isDark }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className={`text-center py-16 px-6 border
      ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-warm-50 border-warm-300'}`}
  >
    <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
      {t('blog.noResults', 'No articles found')}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
      {t('blog.noResultsHint', 'Try adjusting your filters or search terms.')}
    </p>
    <Link
      to="/blog"
      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium uppercase tracking-wider transition-colors"
    >
      {t('blog.clearFiltersButton', 'View All Articles')}
    </Link>
  </motion.div>
);

export default BlogPage;
