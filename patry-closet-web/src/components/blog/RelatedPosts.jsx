import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Clock } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';

const RelatedPosts = ({ posts }) => {
  const { t } = useTranslation();
  const { isDark } = useContext(ThemeContext);

  if (!posts || posts.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {t('blog.relatedArticles', 'You Might Also Like')}
        </h2>
        <Link
          to="/blog"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
        >
          {t('blog.allArticles', 'All Articles')}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {posts.map((post, i) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className={`group rounded-xl overflow-hidden border transition-all hover:shadow-lg
              ${isDark
                ? 'bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-black/20'
                : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-gray-200/60'
              }`}
          >
            <Link to={`/blog/${post.slug}`} className="block">
              <div className="aspect-[16/10] overflow-hidden relative">
                <img
                  src={post.coverImage}
                  alt={post.coverImageAlt}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    {t(`blog.categories.${post.category === 'style-guides' ? 'styleGuides' : post.category === 'behind-the-brand' ? 'behindBrand' : post.category}`, post.category)}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="w-2.5 h-2.5" />
                    {post.readingTime} min
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {t(post.titleKey, post.titleFallback)}
                </h3>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default RelatedPosts;
