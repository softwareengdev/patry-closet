import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { X, Cookie, Shield } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { initGA4 } from '../lib/analytics';

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const { isDark } = useContext(ThemeContext);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
        if (consent === 'accepted') {
            initGA4();
        }
    }, []);

    const accept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setVisible(false);
        initGA4();
    };

    const deny = () => {
        localStorage.setItem('cookie-consent', 'denied');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-label="Consentimiento de cookies"
            className="fixed bottom-0 inset-x-0 z-[9999] p-4 md:p-6"
        >
            <div className={`max-w-2xl mx-auto rounded-2xl shadow-2xl border backdrop-blur-xl transition-all ${
                isDark
                    ? 'bg-gray-900/95 border-gray-800 text-gray-200'
                    : 'bg-warm-50/95 border-warm-400 text-gray-800'
            }`}>
                <div className="p-5 md:p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Cookie className="w-5 h-5 text-rose" />
                            <h3 className="font-semibold text-base">Cookies y Privacidad</h3>
                        </div>
                        <button
                            onClick={deny}
                            className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-warm-200'}`}
                            aria-label="Cerrar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Description */}
                    <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Utilizamos cookies propias y de terceros (Google Analytics) para analizar el uso del sitio y mejorar tu experiencia. Las cookies esenciales son necesarias para el funcionamiento del sitio.{' '}
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-rose hover:text-rose/80 font-medium transition-colors"
                        >
                            {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
                        </button>
                    </p>

                    {/* Details (expandable) */}
                    {showDetails && (
                        <div className={`mb-4 p-4 rounded-xl text-xs space-y-3 ${isDark ? 'bg-gray-800' : 'bg-warm-200/50'}`}>
                            <div className="flex items-start gap-2">
                                <Shield className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium">Cookies Esenciales</p>
                                    <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>Necesarias para el funcionamiento: sesión, carrito, idioma, tema. Siempre activas.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Cookie className="w-4 h-4 text-rose mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium">Cookies de Análisis (Google Analytics 4)</p>
                                    <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>Nos ayudan a entender cómo usas el sitio. IP anonimizada. Requieren tu consentimiento.</p>
                                </div>
                            </div>
                            <p className={`mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Más información en nuestra{' '}
                                <Link to="/cookies" className="text-rose hover:text-rose/80 transition-colors">Política de Cookies</Link>
                                {' '}y{' '}
                                <Link to="/privacy" className="text-rose hover:text-rose/80 transition-colors">Política de Privacidad</Link>.
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={accept}
                            className="flex-1 px-5 py-2.5 bg-accent-900 text-white text-sm font-medium rounded-full hover:bg-accent-800 transition-colors"
                        >
                            Aceptar todas
                        </button>
                        <button
                            onClick={deny}
                            className={`flex-1 px-5 py-2.5 text-sm font-medium rounded-full border transition-colors ${
                                isDark
                                    ? 'border-gray-700 hover:bg-gray-800 text-gray-300'
                                    : 'border-warm-400 hover:bg-warm-200 text-gray-700'
                            }`}
                        >
                            Solo esenciales
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
