import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation, Parallax } from 'swiper/modules';
import { ArrowRight } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/parallax';

/* ─── Secondary Hero Slides ─── */
const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1920&q=85',
    tagKey: 'stories.newArrivals.title',
    tagFallback: 'New Arrivals',
    titleKey: 'stories.newArrivals.subtitle',
    titleFallback: 'Fresh styles just landed',
    ctaKey: 'stories.newArrivals.cta',
    ctaFallback: 'Shop New In',
    link: '/products?badge=new',
    align: 'left',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1920&q=85',
    tagKey: 'stories.sustainable.title',
    tagFallback: 'Sustainable Edit',
    titleKey: 'stories.sustainable.subtitle',
    titleFallback: 'Fashion that cares',
    ctaKey: 'stories.sustainable.cta',
    ctaFallback: 'Explore Conscious',
    link: '/products?trend=sustainable',
    align: 'center',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=85',
    tagKey: 'stories.bestSellers.title',
    tagFallback: 'Best Sellers',
    titleKey: 'stories.bestSellers.subtitle',
    titleFallback: 'Most loved by you',
    ctaKey: 'stories.bestSellers.cta',
    ctaFallback: 'Shop Favorites',
    link: '/products?badge=bestSeller',
    align: 'right',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1920&q=85',
    tagKey: 'stories.lookbook.title',
    tagFallback: 'Spring Lookbook',
    titleKey: 'stories.lookbook.subtitle',
    titleFallback: 'Seasonal inspiration',
    ctaKey: 'stories.lookbook.cta',
    ctaFallback: 'View Lookbook',
    link: '/blog',
    align: 'left',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1920&q=85',
    tagKey: 'stories.trending.title',
    tagFallback: 'Trending Now',
    titleKey: 'stories.trending.subtitle',
    titleFallback: "What everyone's wearing",
    ctaKey: 'stories.trending.cta',
    ctaFallback: 'See Trends',
    link: '/products?sort=popularity',
    align: 'center',
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1920&q=85',
    tagKey: 'stories.premium.title',
    tagFallback: 'Premium Collection',
    titleKey: 'stories.premium.subtitle',
    titleFallback: 'Elevated essentials',
    ctaKey: 'stories.premium.cta',
    ctaFallback: 'Discover Luxe',
    link: '/products?brand=luxe-atelier',
    align: 'right',
  },
];

const alignmentClasses = {
  left: 'items-start text-left pl-8 sm:pl-16 lg:pl-24 pr-8',
  center: 'items-center text-center px-8',
  right: 'items-end text-right pr-8 sm:pr-16 lg:pr-24 pl-8',
};

const AUTOPLAY_DELAY = 5000;

const CuratedStories = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef(null);

  const startProgress = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    setProgress(0);
    const step = 100 / (AUTOPLAY_DELAY / 50);
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(progressInterval.current); return 100; }
        return prev + step;
      });
    }, 50);
  }, []);

  useEffect(() => {
    startProgress();
    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [startProgress]);

  const handleSlideChange = useCallback((swiper) => {
    setActiveIndex(swiper.realIndex);
    startProgress();
  }, [startProgress]);

  return (
    <section
      className="relative w-full"
      style={{ height: '40vh', minHeight: '320px', maxHeight: '480px' }}
      aria-label={t('stories.sectionLabel', 'Curated stories')}
    >
      <Swiper
        modules={[Autoplay, EffectFade, Pagination, Navigation, Parallax]}
        effect="fade"
        speed={1200}
        parallax={true}
        autoplay={{ delay: AUTOPLAY_DELAY, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true, dynamicBullets: false }}
        navigation={true}
        loop={true}
        onSlideChange={handleSlideChange}
        className="hero-swiper !h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            {/* Background image with Ken Burns */}
            <div className="absolute inset-0 w-full h-full">
              <img
                src={slide.image}
                alt=""
                className="hero-slide-image w-full h-full object-cover"
                loading="lazy"
                draggable="false"
              />
            </div>

            {/* Gradient overlays — identical to main hero */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

            {/* Slide content */}
            <div className={`relative z-10 flex flex-col justify-end pb-16 sm:pb-20 h-full max-w-[1440px] mx-auto ${alignmentClasses[slide.align]}`}>
              {/* Tag */}
              <div className="hero-content-animate-delay-1">
                <span className="inline-block text-[10px] sm:text-xs font-medium tracking-ultra-wide uppercase text-white/80 mb-3 sm:mb-4 border border-white/30 px-4 py-1.5">
                  {t(slide.tagKey, slide.tagFallback)}
                </span>
              </div>

              {/* Title */}
              <h2
                data-swiper-parallax="-200"
                className="hero-content-animate-delay-2 font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white leading-[0.95] tracking-tight max-w-2xl mb-4 sm:mb-6"
              >
                {t(slide.titleKey, slide.titleFallback)}
              </h2>

              {/* CTA */}
              <div className="hero-content-animate-delay-3">
                <Link to={slide.link} className="cta-shop-now">
                  <span>{t(slide.ctaKey, slide.ctaFallback)}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/10 z-20">
        <div className="hero-progress-bar h-full bg-white/60" style={{ width: `${progress}%` }} />
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-5 right-8 sm:right-16 z-20 hidden sm:flex items-center gap-3 text-white/50 text-xs font-light tracking-wider">
        <span className="text-white font-medium text-sm">{String(activeIndex + 1).padStart(2, '0')}</span>
        <span className="w-8 h-px bg-white/30" />
        <span>{String(slides.length).padStart(2, '0')}</span>
      </div>
    </section>
  );
};

export default CuratedStories;
