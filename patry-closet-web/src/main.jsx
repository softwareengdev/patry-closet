import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import './index.css';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './i18n/en.json';
import es from './i18n/es.json';
import { initGA4 } from './lib/analytics';
import { reportWebVitals } from './lib/webVitals';

// Initialize GA4 if user has already consented
const cookieConsent = localStorage.getItem('cookie-consent');
if (cookieConsent === 'accepted') {
    initGA4();
}

i18n.use(initReactI18next).use(LanguageDetector).init({
    resources: { en: { translation: en }, es: { translation: es } },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <HelmetProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <App />
                </BrowserRouter>
            </HelmetProvider>
        </QueryClientProvider>
    </React.StrictMode>,
)

reportWebVitals();