import { useState, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Clock, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';

const BADGE_CONFIG = {
  trending: {
    icon: TrendingUp,
    labelKey: 'blog.badgeTrending',
    fallback: 'Trending',
    className: 'bg-amber-500/90 text-white',
  },
  new: {
    icon: Sparkles,
    labelKey: 'blog.badgeNew',
    fallback: 'New',
    className: 'bg-emerald-500/90 text-white',
  },
};

const BlogCard = ({ post, index = 0, variant = 'default' }) => {
  const { t } = useTranslation();
  const { isDark } = useContext(ThemeContext);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: '-40px' });

  const badge = post.badge ? BADGE_CONFIG[post.badge] : null;
  const BadgeIcon = badge?.icon;

  const publishDate = new Date(post.publishedAt).toLocaleDateString(
    t('locale', 'en-US'),
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  const isFeatured = variant === 'featured';

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative bg-warm-50 dark:bg-gray-900 overflow-hidden border transition-all duration-300
        ${isDark
          ? 'border-gray-800 hover:border-gray-700 hover:shadow-xl hover:shadow-black/20'
          : 'border-warm-300 hover:border-warm-400 hover:shadow-xl hover:shadow-gray-200/60'
        }
        ${isFeatured ? 'md:col-span-2 md:grid md:grid-cols-2' : ''}
      `}
    >
      {/* Image */}
      <Link
        to={`/blog/${post.slug}`}
        className={`block relative overflow-hidden ${isFeatured ? 'aspect-[16/10] md:aspect-auto' : 'aspect-[16/10]'}`}
        aria-label={t(post.titleKey, post.titleFallback)}
      >
        {/* Shimmer placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse" />
        )}

        <img
          src={post.coverImage}
          alt={post.coverImageAlt || t(post.titleKey, post.titleFallback)}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Read More overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="bg-warm-50/95 dark:bg-gray-900/95 text-gray-900 dark:text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 backdrop-blur-sm">
            {t('readMore', 'Read More')}
          </span>
        </div>

        {/* Badge */}
        {badge && (
          <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badge.className}`}>
            <BadgeIcon className="w-3 h-3" />
            {t(badge.labelKey, badge.fallback)}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className={`p-5 ${isFeatured ? 'flex flex-col justify-center' : ''}`}>
        {/* Category + Reading time */}
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-[10px] font-bold uppercase tracking-widest
            ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            {t(`blog.categories.${post.category === 'style-guides' ? 'styleGuides' : post.category === 'behind-the-brand' ? 'behindBrand' : post.category}`, post.category)}
          </span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
            <Clock className="w-3 h-3" />
            {post.readingTime} {t('blog.minRead', 'min read')}
          </span>
        </div>

        {/* Title */}
        <Link to={`/blog/${post.slug}`}>
          <h3 className={`font-semibold leading-snug mb-2 transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400
            ${isFeatured ? 'text-lg sm:text-xl lg:text-2xl line-clamp-3' : 'text-sm sm:text-base line-clamp-2'}`}>
            {t(post.titleKey, post.titleFallback)}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className={`text-gray-500 dark:text-gray-400 mb-4 leading-relaxed
          ${isFeatured ? 'text-sm line-clamp-3' : 'text-xs line-clamp-2'}`}>
          {t(post.excerptKey, post.excerptFallback)}
        </p>

        {/* Author + Date */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2.5">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
              loading="lazy"
            />
            <div>
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{post.author.name}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{publishDate}</p>
            </div>
          </div>

          <Link
            to={`/blog/${post.slug}`}
            className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            aria-label={`${t('readMore', 'Read More')}: ${t(post.titleKey, post.titleFallback)}`}
          >
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
};

export default BlogCard;
