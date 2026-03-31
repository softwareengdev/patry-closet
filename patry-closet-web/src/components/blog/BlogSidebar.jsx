import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, Mail, ArrowRight, Tag } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import { blogPosts, BLOG_CATEGORIES, getAllTags } from '../../data/blogPosts';

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const BlogSidebar = ({ currentFilters, onFilterChange }) => {
  const { t } = useTranslation();
  const { isDark } = useContext(ThemeContext);

  // Popular posts: sort by trending/featured first, then newest
  const popularPosts = [...blogPosts]
    .sort((a, b) => {
      if (a.trending && !b.trending) return -1;
      if (!a.trending && b.trending) return 1;
      if (a.featured && !b.featured) return -1;
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    })
    .slice(0, 4);

  const allTags = getAllTags().slice(0, 12);

  const cardClass = `rounded-xl border p-5 ${
    isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-100'
  }`;

  return (
    <aside className="space-y-6" aria-label={t('blog.sidebar', 'Blog sidebar')}>
      {/* ─── Popular Articles ─── */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className={cardClass}>
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-4">
          <TrendingUp className="w-4 h-4 text-amber-500" />
          {t('blog.popularArticles', 'Popular Articles')}
        </h3>
        <div className="space-y-3">
          {popularPosts.map((post, i) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className={`group flex gap-3 p-2 -mx-2 rounded-lg transition-colors
                ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
            >
              <img
                src={post.coverImage}
                alt={post.coverImageAlt}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {t(post.titleKey, post.titleFallback)}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  {post.readingTime} {t('blog.minRead', 'min read')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ─── Categories ─── */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className={cardClass}>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-4">
          {t('blog.categories.title', 'Categories')}
        </h3>
        <div className="space-y-1">
          {BLOG_CATEGORIES.map(cat => {
            const count = blogPosts.filter(p => p.category === cat.id).length;
            const isActive = currentFilters?.category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onFilterChange?.({ ...currentFilters, category: isActive ? '' : cat.id, page: 1 })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all
                  ${isActive
                    ? isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700'
                    : isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <span>{t(cat.labelKey, cat.fallback)}</span>
                <span className={`text-[10px] tabular-nums ${isActive ? 'text-amber-500' : 'text-gray-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Tags Cloud ─── */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className={cardClass}>
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-4">
          <Tag className="w-4 h-4 text-amber-500" />
          {t('blog.tags', 'Tags')}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {allTags.map(tag => {
            const isActive = currentFilters?.tag === tag;
            return (
              <button
                key={tag}
                onClick={() => onFilterChange?.({ ...currentFilters, tag: isActive ? '' : tag, page: 1 })}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all
                  ${isActive
                    ? isDark ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                    : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-gray-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Newsletter ─── */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible"
        className={`rounded-xl border p-5 ${
          isDark
            ? 'bg-gradient-to-br from-amber-900/20 to-gray-900/50 border-amber-800/30'
            : 'bg-gradient-to-br from-amber-50 to-white border-amber-100'
        }`}
      >
        <Mail className="w-8 h-8 text-amber-500 mb-3" />
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
          {t('blog.newsletterTitle', 'Stay in the Loop')}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {t('blog.newsletterSubtitle', 'Get the latest fashion tips delivered weekly.')}
        </p>
        <form onSubmit={e => e.preventDefault()} className="flex gap-2">
          <input
            type="email"
            placeholder={t('blog.newsletterPlaceholder', 'Your email')}
            className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30
              ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
            aria-label={t('blog.newsletterPlaceholder', 'Your email')}
          />
          <button
            type="submit"
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </motion.div>
    </aside>
  );
};

export default BlogSidebar;
