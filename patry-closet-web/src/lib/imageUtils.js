/**
 * Image URL utilities for PATRY♡CLOSET
 *
 * Provides on-the-fly image transformations for:
 * - Unsplash (current product images)
 * - Cloudinary (production CDN)
 * - Local backend uploads
 */

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD || '';

/* ─── URL type detection ─── */

export function isUnsplashUrl(url) {
    return typeof url === 'string' && url.includes('images.unsplash.com');
}

export function isCloudinaryUrl(url) {
    return typeof url === 'string' && url.includes('res.cloudinary.com');
}

/* ─── Unsplash transforms ─── */

function transformUnsplash(url, { width, quality = 80, format } = {}) {
    const u = new URL(url);
    if (width) u.searchParams.set('w', String(width));
    if (quality) u.searchParams.set('q', String(quality));
    if (format) u.searchParams.set('fm', format);
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    return u.toString();
}

/* ─── Cloudinary transforms ─── */

function transformCloudinary(url, { width, quality = 'auto', format = 'auto' } = {}) {
    // Insert transformation segment before /upload/ path or /v{version}/
    const parts = [];
    if (format) parts.push(`f_${format}`);
    if (quality) parts.push(`q_${quality}`);
    if (width) parts.push(`w_${width}`);
    parts.push('c_fill');

    const transform = parts.join(',');

    // Pattern: .../upload/v1234/folder/image.jpg → .../upload/{transform}/v1234/folder/image.jpg
    return url.replace(/\/upload\//, `/upload/${transform}/`);
}

/**
 * Build a Cloudinary delivery URL from scratch (for new uploads).
 * Requires VITE_CLOUDINARY_CLOUD env var.
 */
export function cloudinaryUrl(publicId, { width, height, quality = 'auto', format = 'auto', crop = 'fill', gravity = 'auto' } = {}) {
    if (!CLOUDINARY_CLOUD) return publicId;

    const parts = [`f_${format}`, `q_${quality}`];
    if (width) parts.push(`w_${width}`);
    if (height) parts.push(`h_${height}`);
    if (crop) parts.push(`c_${crop}`);
    if (gravity) parts.push(`g_${gravity}`);

    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${parts.join(',')}/${publicId}`;
}

/* ─── Universal buildImageUrl ─── */

/**
 * Transform any image URL with width/quality/format options.
 * Automatically detects Unsplash vs Cloudinary vs passthrough.
 *
 * @param {string} src - Original image URL
 * @param {object} opts
 * @param {number} [opts.width] - Target width in pixels
 * @param {number|string} [opts.quality=80] - Quality (1-100 or 'auto')
 * @param {string} [opts.format] - 'webp', 'avif', 'auto', etc.
 * @returns {string} Transformed URL
 */
export function buildImageUrl(src, { width, quality = 80, format } = {}) {
    if (!src) return '';

    if (isUnsplashUrl(src)) {
        return transformUnsplash(src, { width, quality, format });
    }

    if (isCloudinaryUrl(src)) {
        return transformCloudinary(src, { width, quality: quality || 'auto', format: format || 'auto' });
    }

    // Local backend URLs or other — append query params if possible
    try {
        const u = new URL(src, window.location.origin);
        if (width) u.searchParams.set('w', String(width));
        if (quality) u.searchParams.set('q', String(quality));
        return u.toString();
    } catch {
        return src;
    }
}

/**
 * Generate a tiny LQIP (Low Quality Image Placeholder) URL.
 * Returns a 20px wide, heavily compressed version of the image.
 */
export function buildLqipUrl(src) {
    if (!src) return '';

    if (isUnsplashUrl(src)) {
        return transformUnsplash(src, { width: 20, quality: 20 });
    }

    if (isCloudinaryUrl(src)) {
        return transformCloudinary(src, { width: 20, quality: 10, format: 'auto' });
    }

    return src;
}

/**
 * Generate a responsive srcSet string for an image.
 * @param {string} src - Original image URL
 * @param {number[]} widths - Array of target widths
 * @param {object} opts - { quality, format }
 * @returns {string} srcSet attribute value
 */
export function buildSrcSet(src, widths = [400, 600, 800, 1200], opts = {}) {
    if (!src) return '';

    return widths
        .map(w => `${buildImageUrl(src, { ...opts, width: w })} ${w}w`)
        .join(', ');
}

/**
 * Default responsive sizes for common layouts.
 */
export const SIZES = {
    productCard: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
    productDetail: '(max-width: 768px) 100vw, 50vw',
    hero: '100vw',
    thumbnail: '80px',
    cartItem: '80px',
    blogCard: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
};

/**
 * Standard srcSet widths for different use cases.
 */
export const WIDTHS = {
    productCard: [300, 400, 600, 800],
    productDetail: [600, 800, 1200, 1600],
    hero: [640, 1024, 1440, 1920],
    thumbnail: [80, 160],
    cartItem: [80, 160],
    blogCard: [400, 600, 800, 1200],
};
