/**
 * OptimizedImage — advanced responsive image component for PATRY♡CLOSET.
 *
 * Features:
 *  • Responsive srcSet with configurable sizes
 *  • Blur-up LQIP (20 px placeholder → full-res crossfade)
 *  • Unsplash / Cloudinary format detection (WebP / f_auto)
 *  • IntersectionObserver lazy loading with configurable rootMargin
 *  • Error handling with retry + elegant fallback SVG
 *  • Aspect-ratio container (CLS prevention)
 *  • Hover image crossfade (product cards)
 *  • Fade-in / scale-in entrance animation
 */

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { buildImageUrl, buildSrcSet, buildLqipUrl } from '../../lib/imageUtils';

/* ─── Fallback SVG (neutral camera placeholder) ───────────────────────── */
const FALLBACK_SVG =
    'data:image/svg+xml,' +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#E8E3DA"/>
  <g transform="translate(200,200)" fill="none" stroke="#A39B8C" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
    <rect x="-48" y="-36" width="96" height="72" rx="8"/>
    <circle r="20"/>
    <path d="M-20,-36 L-12,-52 H12 L20,-36"/>
  </g>
</svg>`,
    );

/* ─── Component ───────────────────────────────────────────────────────── */

/**
 * @param {Object}  props
 * @param {string}  props.src              – Image source URL (required)
 * @param {string}  props.alt              – Alt text (required)
 * @param {number}  [props.width]
 * @param {number}  [props.height]
 * @param {string}  [props.sizes]          – Responsive `sizes` attribute
 * @param {string}  [props.aspectRatio]    – e.g. "3/4", "1/1", "16/9"
 * @param {boolean} [props.priority]       – Eager load (skip IntersectionObserver)
 * @param {string}  [props.hoverSrc]       – Secondary image for hover crossfade
 * @param {string}  [props.className]      – Extra classes on wrapper
 * @param {string}  [props.imgClassName]   – Extra classes on <img>
 * @param {string}  [props.placeholderColor] – Tailwind bg class token (default 'warm-200')
 * @param {number}  [props.quality]        – 1-100 (default 80)
 * @param {Function} [props.onLoad]
 * @param {Function} [props.onError]
 * @param {boolean} [props.fill]           – object-fit: cover, fill container
 * @param {boolean} [props.animate]        – Scale-in entrance (default false)
 * @param {string}  [props.rootMargin]     – IntersectionObserver rootMargin (default '300px')
 */
function OptimizedImage({
    src,
    alt,
    width,
    height,
    sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
    aspectRatio,
    priority = false,
    hoverSrc,
    className = '',
    imgClassName = '',
    placeholderColor = 'warm-200',
    quality = 80,
    onLoad,
    onError,
    fill = false,
    animate = false,
    rootMargin = '300px',
}) {
    /* ── State ──────────────────────────────────────────────── */
    const [isInView, setIsInView] = useState(priority);
    const [lqipLoaded, setLqipLoaded] = useState(false);
    const [mainLoaded, setMainLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [retried, setRetried] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const containerRef = useRef(null);
    const hoverImgRef = useRef(null);

    /* ── Derived URLs ───────────────────────────────────────── */
    const lqipSrc = buildLqipUrl(src);
    const mainSrc = buildImageUrl(src, { width: width || undefined, quality });
    const srcSet = buildSrcSet(src, undefined, { quality });
    const hoverFullSrc = hoverSrc ? buildImageUrl(hoverSrc, { width: width || undefined, quality }) : '';

    /* ── IntersectionObserver (lazy load) ────────────────────── */
    useEffect(() => {
        if (priority || isInView) return;
        const el = containerRef.current;
        if (!el) return;

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    io.disconnect();
                }
            },
            { rootMargin },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [priority, isInView, rootMargin]);

    /* ── Preload hover image when in view ───────────────────── */
    useEffect(() => {
        if (!hoverSrc || !isInView) return;
        const img = new Image();
        img.src = buildImageUrl(hoverSrc, { quality });
        hoverImgRef.current = img;
    }, [hoverSrc, isInView, quality]);

    /* ── Handlers ───────────────────────────────────────────── */
    const handleMainLoad = useCallback(() => {
        setMainLoaded(true);
        onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
        if (!retried) {
            // Retry once
            setRetried(true);
            setHasError(false);
            return;
        }
        setHasError(true);
        onError?.();
    }, [retried, onError]);

    /* ── Styles ─────────────────────────────────────────────── */
    const wrapperStyle = {};
    if (aspectRatio) {
        wrapperStyle.aspectRatio = aspectRatio;
    }

    const imgPositionClass = fill
        ? 'absolute inset-0 w-full h-full object-cover'
        : 'w-full h-full object-cover';

    const entranceClass = animate
        ? 'transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
        : 'transition-opacity duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]';

    const loadedTransform = animate
        ? mainLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]'
        : mainLoaded ? 'opacity-100' : 'opacity-0';

    /* ── Render ──────────────────────────────────────────────── */
    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden bg-${placeholderColor} ${className}`}
            style={wrapperStyle}
            onMouseEnter={hoverSrc ? () => setIsHovered(true) : undefined}
            onMouseLeave={hoverSrc ? () => setIsHovered(false) : undefined}
        >
            {/* LQIP blur-up placeholder */}
            {isInView && !hasError && (
                <img
                    src={lqipSrc}
                    alt=""
                    aria-hidden="true"
                    onLoad={() => setLqipLoaded(true)}
                    className={[
                        'absolute inset-0 w-full h-full object-cover',
                        'scale-110',                         // slight overscale to hide blur edges
                        'transition-opacity duration-500',
                        mainLoaded ? 'opacity-0' : lqipLoaded ? 'opacity-100' : 'opacity-0',
                    ].join(' ')}
                    style={{ filter: 'blur(20px)' }}
                />
            )}

            {/* Main image */}
            {isInView && !hasError && (
                <img
                    key={retried ? 'retry' : 'first'}
                    src={mainSrc}
                    srcSet={srcSet}
                    sizes={sizes}
                    alt={alt}
                    width={width}
                    height={height}
                    loading={priority ? 'eager' : 'lazy'}
                    fetchpriority={priority ? 'high' : undefined}
                    decoding={priority ? 'sync' : 'async'}
                    onLoad={handleMainLoad}
                    onError={handleError}
                    className={[imgPositionClass, entranceClass, loadedTransform, imgClassName].join(' ')}
                />
            )}

            {/* Hover image crossfade */}
            {hoverSrc && isInView && !hasError && (
                <img
                    src={hoverFullSrc}
                    srcSet={buildSrcSet(hoverSrc, undefined, { quality })}
                    sizes={sizes}
                    alt={`${alt} – alternate view`}
                    loading="lazy"
                    decoding="async"
                    className={[
                        'absolute inset-0 w-full h-full object-cover',
                        'transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        isHovered ? 'opacity-100' : 'opacity-0',
                    ].join(' ')}
                />
            )}

            {/* Error fallback */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-warm-300">
                    <img
                        src={FALLBACK_SVG}
                        alt={alt}
                        className="w-full h-full object-cover opacity-60"
                    />
                </div>
            )}
        </div>
    );
}

export { OptimizedImage };
export default memo(OptimizedImage);
