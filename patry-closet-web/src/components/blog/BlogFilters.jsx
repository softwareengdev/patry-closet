import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Search, SlidersHorizontal } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import { BLOG_CATEGORIES, BLOG_SEASONS } from '../../hooks/useBlog';

const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'blog.sortNewest', fallback: 'Newest First' },
  { value: 'oldest', labelKey: 'blog.sortOldest', fallback: 'Oldest First' },
  { value: 'reading-time', labelKey: 'blog.sortReadingTime', fallback: 'Quick Reads' },
];

const BlogFilters = ({
  filters,
  onFilterChange,
  totalResults = 0,
  isOpen,
  onToggle,
}) => {
  const { t } = useTranslation();
  const { isDark } = useContext(ThemeContext);

  const activeCount = [filters.category, filters.season, filters.tag, filters.query].filter(Boolean).length;

  const handleClear = () => {
    onFilterChange({ category: '', season: '', tag: '', query: '', sort: 'newest', page: 1 });
  };

  const updateFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value, page: 1 });
  };

  const chipBase = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer select-none`;
  const chipActive = isDark
    ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  const chipInactive = isDark
    ? 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-gray-300'
    : 'bg-gray-100 text-gray-600 hover:bg-gray-200';

  return (
    <div className="space-y-4">
      {/* ─── Top Bar: Search + Sort + Toggle ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={filters.query || ''}
            onChange={e => updateFilter('query', e.target.value)}
            placeholder={t('blog.searchArticles', 'Search articles...')}
            className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30
              ${isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
              }`}
            aria-label={t('blog.searchArticles', 'Search articles')}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort */}
          <select
            value={filters.sort || 'newest'}
            onChange={e => updateFilter('sort', e.target.value)}
            className={`text-xs font-medium px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30
              ${isDark
                ? 'bg-gray-800 border-gray-700 text-gray-300'
                : 'bg-white border-gray-200 text-gray-700'
              }`}
            aria-label={t('blog.sortBy', 'Sort by')}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey, opt.fallback)}
              </option>
            ))}
          </select>

          {/* Filter toggle */}
          <button
            onClick={onToggle}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all
              ${isOpen
                ? isDark ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'
                : isDark ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-300' : 'bg-white border-gray-200 text-gray-600 hover:text-gray-800'
              }`}
            aria-expanded={isOpen}
            aria-label={t('blog.toggleFilters', 'Toggle filters')}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t('blog.filters', 'Filters')}
            {activeCount > 0 && (
              <span className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-bold">
                {activeCount}
              </span>
            )}
          </button>

          {/* Clear all */}
          {activeCount > 0 && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              aria-label={t('blog.clearFilters', 'Clear filters')}
            >
              <X className="w-3 h-3" />
              {t('blog.clearAll', 'Clear all')}
            </button>
          )}

          {/* Results count */}
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto sm:ml-2">
            {totalResults} {t('blog.articles', 'articles')}
          </span>
        </div>
      </div>

      {/* ─── Expandable Filter Panel ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className={`p-4 rounded-xl border space-y-4
              ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>

              {/* Categories */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  {t('blog.filterCategory', 'Category')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateFilter('category', '')}
                    className={`${chipBase} ${!filters.category ? chipActive : chipInactive}`}
                  >
                    {t('blog.allCategories', 'All')}
                  </button>
                  {BLOG_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => updateFilter('category', cat.id)}
                      className={`${chipBase} ${filters.category === cat.id ? chipActive : chipInactive}`}
                    >
                      {t(cat.labelKey, cat.fallback)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seasons */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  {t('blog.filterSeason', 'Season')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateFilter('season', '')}
                    className={`${chipBase} ${!filters.season ? chipActive : chipInactive}`}
                  >
                    {t('blog.allSeasons', 'All')}
                  </button>
                  {BLOG_SEASONS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => updateFilter('season', s.id)}
                      className={`${chipBase} ${filters.season === s.id ? chipActive : chipInactive}`}
                    >
                      {t(s.labelKey, s.fallback)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogFilters;
