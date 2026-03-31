import { createContext, useState, useEffect, useCallback, useMemo } from 'react';

export const ThemeContext = createContext();

const THEME_KEY = 'patry-theme';
const VALID_MODES = ['light', 'dark', 'auto', 'high-contrast'];

function getSystemPreference() {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveEffective(mode) {
    if (mode === 'auto') return getSystemPreference();
    if (mode === 'high-contrast') return 'dark';
    return mode;
}

export const ThemeProvider = ({ children }) => {
    const [mode, setModeRaw] = useState(() => {
        const saved = localStorage.getItem(THEME_KEY);
        return VALID_MODES.includes(saved) ? saved : 'light';
    });

    const effectiveTheme = useMemo(() => resolveEffective(mode), [mode]);
    const isDark = effectiveTheme === 'dark' || mode === 'high-contrast';
    const isHighContrast = mode === 'high-contrast';

    const setMode = useCallback((newMode) => {
        if (!VALID_MODES.includes(newMode)) return;
        setModeRaw(newMode);
        localStorage.setItem(THEME_KEY, newMode);
    }, []);

    const cycleTheme = useCallback(() => {
        const idx = VALID_MODES.indexOf(mode);
        setMode(VALID_MODES[(idx + 1) % VALID_MODES.length]);
    }, [mode, setMode]);

    // Apply classes to <html>
    useEffect(() => {
        const html = document.documentElement;

        html.classList.remove('dark', 'high-contrast');

        if (isDark) html.classList.add('dark');
        if (isHighContrast) html.classList.add('high-contrast');

        html.setAttribute('data-theme', mode);
    }, [mode, isDark, isHighContrast]);

    // Listen for OS theme changes when in 'auto' mode
    useEffect(() => {
        if (mode !== 'auto') return;
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => setModeRaw(prev => prev); // trigger re-render
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [mode]);

    const value = useMemo(() => ({
        mode,
        effectiveTheme,
        isDark,
        isHighContrast,
        setMode,
        cycleTheme,
    }), [mode, effectiveTheme, isDark, isHighContrast, setMode, cycleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
