import { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import BlogCard from '../components/blog/BlogCard';
import BlogFilters from '../components/blog/BlogFilters';
import BlogSidebar from '../components/blog/BlogSidebar';
import { useBlogPosts, useFeaturedPosts } from '../hooks/useBlog';

const BlogPage = () => {
  const { t } = useTranslation();
  const { isDark } = useContext(ThemeContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  // Read filters from URL params
  const filters = {
    page: parseInt(searchParams.get('page')) || 1,
    perPage: 6,
    category: searchParams.get('category') || '',
    season: searchParams.get('season') || '',
    tag: searchParams.get('tag') || '',
    query: searchParams.get('q') || '',
    sort: searchParams.get('sort') || 'newest',
  };

  const { data, isLoading, isFetching } = useBlogPosts(filters);
  const { data: featuredPosts } = useFeaturedPosts();

  // Sync filters to URL
  const handleFilterChange = useCallback((newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.season) params.set('season', newFilters.season);
    if (newFilters.tag) params.set('tag', newFilters.tag);
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.sort && newFilters.sort !== 'newest') params.set('sort', newFilters.sort);
    if (newFilters.page > 1) params.set('page', newFilters.page.toString());
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters.page]);

  // GA4 analytics
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'blog_view', { page: filters.page, category: filters.category });
    }
  }, [filters.page, filters.category]);

  const posts = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Featured hero post (first featured, not shown in main grid)
  const heroPost = featuredPosts?.[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* ─── HERO SECTION ─── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-gray-900 text-white"
      >
        {/* Background image */}
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
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

          {/* Featured post card */}
          {heroPost && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-10"
            >
              <Link
                to={`/blog/${heroPost.slug}`}
                className="group inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 pr-6 hover:bg-white/10 transition-all"
              >
                <img
                  src={heroPost.coverImage}
                  alt={heroPost.coverImageAlt}
                  className="w-20 h-16 sm:w-28 sm:h-20 object-cover rounded-lg flex-shrink-0"
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
            ) : posts.length === 0 ? (
              <EmptyState t={t} isDark={isDark} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {posts.map((post, i) => (
                    <BlogCard
                      key={post.id}
                      post={post}
                      index={i}
                      variant={i === 0 && filters.page === 1 && !filters.category ? 'featured' : 'default'}
                    />
                  ))}
                </div>

                {/* Loading overlay during pagination */}
                {isFetching && !isLoading && (
                  <div className="mt-6 flex justify-center">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    page={filters.page}
                    totalPages={totalPages}
                    onPageChange={p => handleFilterChange({ ...filters, page: p })}
                    isDark={isDark}
                    t={t}
                  />
                )}
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

// ─── PAGINATION ───
const Pagination = ({ page, totalPages, onPageChange, isDark, t }) => (
  <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Pagination">
    <button
      onClick={() => onPageChange(page - 1)}
      disabled={page <= 1}
      className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed
        ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
      aria-label={t('blog.prevPage', 'Previous page')}
    >
      <ChevronLeft className="w-4 h-4" />
    </button>

    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
      <button
        key={p}
        onClick={() => onPageChange(p)}
        className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all
          ${p === page
            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
            : isDark
              ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        aria-current={p === page ? 'page' : undefined}
        aria-label={`${t('blog.page', 'Page')} ${p}`}
      >
        {p}
      </button>
    ))}

    <button
      onClick={() => onPageChange(page + 1)}
      disabled={page >= totalPages}
      className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed
        ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
      aria-label={t('blog.nextPage', 'Next page')}
    >
      <ChevronRight className="w-4 h-4" />
    </button>
  </nav>
);

// ─── SKELETON GRID ───
const BlogGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className={`rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 ${i === 0 ? 'sm:col-span-2 sm:grid sm:grid-cols-2' : ''}`}>
        <div className={`bg-gray-200 dark:bg-gray-800 animate-pulse ${i === 0 ? 'aspect-auto min-h-[200px]' : 'aspect-[16/10]'}`} />
        <div className="p-5 space-y-3">
          <div className="flex gap-2">
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3 w-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="flex items-center gap-2 pt-2">
            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
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
    className={`text-center py-16 px-6 rounded-xl border
      ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-100'}`}
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
      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
    >
      {t('blog.clearFiltersButton', 'View All Articles')}
    </Link>
  </motion.div>
);

export default BlogPage;
