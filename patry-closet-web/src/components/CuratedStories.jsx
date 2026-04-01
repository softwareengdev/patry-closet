import { useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Mousewheel, A11y } from 'swiper/modules';
import { ArrowRight, Sparkles, Leaf, Star, Camera, TrendingUp, Crown } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

import 'swiper/css';
import 'swiper/css/free-mode';

/* ─── Story Cards Data ─── */
const stories = [
  {
    id: 'new-arrivals',
    titleKey: 'stories.newArrivals.title',
    titleFallback: 'New Arrivals',
    subtitleKey: 'stories.newArrivals.subtitle',
    subtitleFallback: 'Fresh styles just landed',
    ctaKey: 'stories.newArrivals.cta',
    ctaFallback: 'Shop New In',
    link: '/products?badge=new',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=800&q=80',
    icon: Sparkles,
    accent: 'from-amber-500/90 to-orange-600/90',
    accentLight: 'bg-amber-500',
  },
  {
    id: 'sustainable-edit',
    titleKey: 'stories.sustainable.title',
    titleFallback: 'Sustainable Edit',
    subtitleKey: 'stories.sustainable.subtitle',
    subtitleFallback: 'Fashion that cares',
    ctaKey: 'stories.sustainable.cta',
    ctaFallback: 'Explore Conscious',
    link: '/products?trend=sustainable',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
    icon: Leaf,
    accent: 'from-emerald-500/90 to-teal-600/90',
    accentLight: 'bg-emerald-500',
  },
  {
    id: 'best-sellers',
    titleKey: 'stories.bestSellers.title',
    titleFallback: 'Best Sellers',
    subtitleKey: 'stories.bestSellers.subtitle',
    subtitleFallback: 'Most loved by you',
    ctaKey: 'stories.bestSellers.cta',
    ctaFallback: 'Shop Favorites',
    link: '/products?badge=bestSeller',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
    icon: Star,
    accent: 'from-rose-500/90 to-pink-600/90',
    accentLight: 'bg-rose-500',
  },
  {
    id: 'spring-lookbook',
    titleKey: 'stories.lookbook.title',
    titleFallback: 'Spring Lookbook',
    subtitleKey: 'stories.lookbook.subtitle',
    subtitleFallback: 'Seasonal inspiration',
    ctaKey: 'stories.lookbook.cta',
    ctaFallback: 'View Lookbook',
    link: '/blog',
    image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80',
    icon: Camera,
    accent: 'from-violet-500/90 to-purple-600/90',
    accentLight: 'bg-violet-500',
  },
  {
    id: 'trending-now',
    titleKey: 'stories.trending.title',
    titleFallback: 'Trending Now',
    subtitleKey: 'stories.trending.subtitle',
    subtitleFallback: 'What everyone\'s wearing',
    ctaKey: 'stories.trending.cta',
    ctaFallback: 'See Trends',
    link: '/products?sort=popularity',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
    icon: TrendingUp,
    accent: 'from-sky-500/90 to-blue-600/90',
    accentLight: 'bg-sky-500',
  },
  {
    id: 'premium-collection',
    titleKey: 'stories.premium.title',
    titleFallback: 'Premium Collection',
    subtitleKey: 'stories.premium.subtitle',
    subtitleFallback: 'Elevated essentials',
    ctaKey: 'stories.premium.cta',
    ctaFallback: 'Discover Luxe',
    link: '/products?brand=luxe-atelier',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80',
    icon: Crown,
    accent: 'from-neutral-700/90 to-neutral-900/90',
    accentLight: 'bg-neutral-700',
  },
];

/* ─── Animation variants ─── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── Story Card ─── */
const StoryCard = ({ story, index, t }) => {
  const Icon = story.icon;

  return (
    <motion.div variants={cardVariants} className="h-full">
      <Link
        to={story.link}
        className="group relative block h-full overflow-hidden rounded-2xl"
        aria-label={t(story.titleKey, story.titleFallback)}
      >
        {/* Background image with parallax-like scale on hover */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={story.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        </div>

        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t ${story.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-5 sm:p-6">
          {/* Icon badge */}
          <div className={`w-9 h-9 rounded-xl ${story.accentLight} flex items-center justify-center mb-3 shadow-lg
            transform transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1`}>
            <Icon className="w-4 h-4 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-semibold text-white leading-tight mb-1 tracking-tight
            transform transition-all duration-500 group-hover:-translate-y-1">
            {t(story.titleKey, story.titleFallback)}
          </h3>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-white/70 mb-3 transition-all duration-500 group-hover:text-white/90 group-hover:-translate-y-1">
            {t(story.subtitleKey, story.subtitleFallback)}
          </p>

          {/* CTA */}
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/80
            transform transition-all duration-500 group-hover:text-white group-hover:-translate-y-1">
            <span>{t(story.ctaKey, story.ctaFallback)}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
          </div>

          {/* Bottom line accent */}
          <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${story.accentLight}
            transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
        </div>
      </Link>
    </motion.div>
  );
};

/* ─── Main Component ─── */
const CuratedStories = () => {
  const { t } = useTranslation();
  const { isDark, isHighContrast } = useContext(ThemeContext);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section
      ref={sectionRef}
      className={`relative w-full overflow-hidden py-16 sm:py-20 lg:py-24 ${
        isHighContrast
          ? 'bg-hc-bg'
          : isDark
            ? 'bg-gray-900'
            : 'bg-neutral-50'
      }`}
      aria-label={t('stories.sectionLabel', 'Curated stories')}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 sm:mb-12"
        >
          <div>
            <span className={`text-[11px] font-medium uppercase tracking-ultra-wide mb-3 block ${
              isHighContrast ? 'text-hc-accent' : 'text-gray-400 dark:text-gray-500'
            }`}>
              {t('stories.sectionTag', 'Curated for You')}
            </span>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-light tracking-tight ${
              isHighContrast ? 'text-hc-fg' : 'text-gray-900 dark:text-white'
            }`}>
              {t('stories.sectionTitle', 'Explore Our World')}
            </h2>
          </div>
          <Link
            to="/products"
            className={`group flex items-center gap-2 text-sm font-medium transition-colors ${
              isHighContrast
                ? 'text-hc-accent hover:text-hc-fg'
                : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            {t('stories.viewAll', 'View All Collections')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* ─── Desktop: Swiper horizontal scroll ─── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="hidden sm:block"
        >
          <Swiper
            modules={[FreeMode, Mousewheel, A11y]}
            spaceBetween={16}
            slidesPerView="auto"
            freeMode={{ enabled: true, momentum: true, momentumRatio: 0.6 }}
            mousewheel={{ forceToAxis: true, sensitivity: 0.8 }}
            grabCursor
            breakpoints={{
              640: { spaceBetween: 16 },
              768: { spaceBetween: 20 },
              1024: { spaceBetween: 24 },
            }}
            className="!overflow-visible"
            a11y={{
              prevSlideMessage: t('stories.prevSlide', 'Previous story'),
              nextSlideMessage: t('stories.nextSlide', 'Next story'),
              slideLabelMessage: '{{index}} / {{slidesLength}}',
            }}
          >
            {stories.map((story, i) => (
              <SwiperSlide
                key={story.id}
                className="!w-[280px] sm:!w-[300px] md:!w-[320px] lg:!w-[340px] !h-[420px] sm:!h-[440px] lg:!h-[460px]"
              >
                <StoryCard story={story} index={i} t={t} />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Scroll hint */}
          <div className={`flex items-center gap-2 mt-6 text-[11px] tracking-wider uppercase ${
            isHighContrast ? 'text-hc-fg/60' : 'text-gray-400 dark:text-gray-600'
          }`}>
            <div className="w-8 h-px bg-current" />
            <span>{t('stories.scrollHint', 'Scroll to explore')}</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </motion.div>

        {/* ─── Mobile: Vertical snap scroll grid ─── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="sm:hidden grid grid-cols-1 gap-4"
        >
          {stories.slice(0, 4).map((story, i) => (
            <div key={story.id} className="h-[240px]">
              <StoryCard story={story} index={i} t={t} />
            </div>
          ))}

          {/* "See more" link on mobile */}
          <Link
            to="/products"
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors border ${
              isDark
                ? 'border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {t('stories.seeMoreMobile', 'Explore All Collections')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CuratedStories;
