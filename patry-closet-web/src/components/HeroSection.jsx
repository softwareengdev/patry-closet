import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation, Parallax } from 'swiper/modules';
import { ArrowRight, ChevronDown } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/parallax';

const heroSlides = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1920&q=85',
        tagKey: 'heroTagNewSeason',
        titleKey: 'heroTitleSlide1',
        subtitleKey: 'heroSubtitleSlide1',
        ctaKey: 'shopNow',
        ctaLink: '/products',
        align: 'left',
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1920&q=85',
        tagKey: 'heroTagExclusive',
        titleKey: 'heroTitleSlide2',
        subtitleKey: 'heroSubtitleSlide2',
        ctaKey: 'shopCollection',
        ctaLink: '/products?category=vestidos',
        align: 'center',
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1920&q=85',
        tagKey: 'heroTagEditorial',
        titleKey: 'heroTitleSlide3',
        subtitleKey: 'heroSubtitleSlide3',
        ctaKey: 'discoverMore',
        ctaLink: '/products?category=accesorios',
        align: 'right',
    },
    {
        id: 4,
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1920&q=85',
        tagKey: 'heroTagLimited',
        titleKey: 'heroTitleSlide4',
        subtitleKey: 'heroSubtitleSlide4',
        ctaKey: 'shopNow',
        ctaLink: '/products',
        align: 'left',
    },
];

const alignmentClasses = {
    left: 'items-start text-left pl-8 sm:pl-16 lg:pl-24 pr-8',
    center: 'items-center text-center px-8',
    right: 'items-end text-right pr-8 sm:pr-16 lg:pr-24 pl-8',
};

const HeroSection = () => {
    const { t } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const swiperRef = useRef(null);
    const progressInterval = useRef(null);

    const AUTOPLAY_DELAY = 6000;

    const startProgress = useCallback(() => {
        if (progressInterval.current) clearInterval(progressInterval.current);
        setProgress(0);
        const step = 100 / (AUTOPLAY_DELAY / 50);
        progressInterval.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval.current);
                    return 100;
                }
                return prev + step;
            });
        }, 50);
    }, []);

    useEffect(() => {
        startProgress();
        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [startProgress]);

    const handleSlideChange = useCallback((swiper) => {
        setActiveIndex(swiper.realIndex);
        startProgress();
    }, [startProgress]);

    const scrollToContent = () => {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    };

    return (
        <section className="relative w-full h-screen" style={{ height: '100dvh' }}>
            <Swiper
                ref={swiperRef}
                modules={[Autoplay, EffectFade, Pagination, Navigation, Parallax]}
                effect="fade"
                speed={1200}
                parallax={true}
                autoplay={{
                    delay: AUTOPLAY_DELAY,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                }}
                pagination={{
                    clickable: true,
                    dynamicBullets: false,
                }}
                navigation={true}
                loop={true}
                onSlideChange={handleSlideChange}
                className="hero-swiper"
            >
                {heroSlides.map((slide) => (
                    <SwiperSlide key={slide.id}>
                        {/* Background image with Ken Burns */}
                        <div className="absolute inset-0 w-full h-full">
                            <img
                                src={slide.image}
                                alt=""
                                className="hero-slide-image w-full h-full object-cover"
                                loading={slide.id === 1 ? 'eager' : 'lazy'}
                                draggable="false"
                            />
                        </div>

                        {/* Gradient overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

                        {/* Slide content */}
                        <div className={`relative z-10 flex flex-col justify-end pb-28 sm:pb-32 lg:pb-36 h-full max-w-[1440px] mx-auto ${alignmentClasses[slide.align]}`}>
                            {/* Tag */}
                            <div className="hero-content-animate-delay-1">
                                <span className="inline-block text-[10px] sm:text-xs font-medium tracking-ultra-wide uppercase text-white/80 mb-4 sm:mb-6 border border-white/30 px-4 py-1.5">
                                    {t(slide.tagKey)}
                                </span>
                            </div>

                            {/* Title */}
                            <h1
                                data-swiper-parallax="-200"
                                className="hero-content-animate-delay-2 font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light text-white leading-[0.95] tracking-tight max-w-3xl mb-4 sm:mb-6"
                            >
                                {t(slide.titleKey)}
                            </h1>

                            {/* Subtitle */}
                            <p
                                data-swiper-parallax="-100"
                                className="hero-content-animate-delay-2 text-sm sm:text-base font-light text-white/70 max-w-lg mb-8 sm:mb-10 tracking-wide leading-relaxed"
                            >
                                {t(slide.subtitleKey)}
                            </p>

                            {/* CTA */}
                            <div className="hero-content-animate-delay-3">
                                <Link to={slide.ctaLink} className="cta-shop-now">
                                    <span>{t(slide.ctaKey)}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Autoplay progress bar */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/10 z-20">
                <div
                    className="hero-progress-bar h-full bg-white/60"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Slide counter */}
            <div className="absolute bottom-10 right-8 sm:right-16 z-20 hidden sm:flex items-center gap-3 text-white/50 text-xs font-light tracking-wider">
                <span className="text-white font-medium text-sm">{String(activeIndex + 1).padStart(2, '0')}</span>
                <span className="w-8 h-px bg-white/30" />
                <span>{String(heroSlides.length).padStart(2, '0')}</span>
            </div>

            {/* Scroll indicator */}
            <button
                onClick={scrollToContent}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/50 hover:text-white/80 transition-colors cursor-pointer bg-transparent border-none"
                aria-label="Scroll down"
            >
                <span className="text-[10px] uppercase tracking-mega-wide font-light">Scroll</span>
                <ChevronDown className="w-4 h-4 scroll-indicator" />
            </button>
        </section>
    );
};

export default HeroSection;