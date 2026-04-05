/**
 * Core Web Vitals reporting — sends metrics to Google Analytics 4.
 *
 * Tracks: LCP, FID, CLS, FCP, TTFB, INP
 * Reports to GA4 as custom events for monitoring.
 */
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

function sendToGA4({ name, delta, id, rating }) {
    // Only report if GA4 is initialized
    if (typeof window.gtag !== 'function') return;

    window.gtag('event', name, {
        event_category: 'Web Vitals',
        event_label: id,
        value: Math.round(name === 'CLS' ? delta * 1000 : delta),
        non_interaction: true,
        metric_rating: rating,
    });
}

function logToConsole({ name, delta, rating }) {
    if (import.meta.env.DEV) {
        const color = rating === 'good' ? '#0CCE6B' : rating === 'needs-improvement' ? '#FFA400' : '#FF4E42';
        console.log(
            `%c[Web Vitals] ${name}: ${name === 'CLS' ? delta.toFixed(3) : Math.round(delta)}ms (${rating})`,
            `color: ${color}; font-weight: bold;`
        );
    }
}

export function reportWebVitals() {
    const report = (metric) => {
        logToConsole(metric);
        sendToGA4(metric);
    };

    onCLS(report);
    onFCP(report);
    onINP(report);
    onLCP(report);
    onTTFB(report);
}
