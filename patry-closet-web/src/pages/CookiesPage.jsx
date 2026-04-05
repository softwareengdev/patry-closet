import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import SEOHead, { getBreadcrumbSchema } from '../components/SEOHead';
import FooterSection from '../components/FooterSection';

const CookiesPage = () => {
    const { isDark } = useContext(ThemeContext);
    const { t } = useTranslation();

    const breadcrumbs = getBreadcrumbSchema([
        { name: 'Inicio', url: '/' },
        { name: 'Política de Cookies', url: '/cookies' },
    ]);

    const cardClass = isDark
        ? 'bg-gray-900 border-gray-800 hover:border-gray-700 transition-all'
        : 'bg-warm-50 border-warm-400 hover:border-warm-500 transition-all';

    const linkClass = 'text-rose hover:text-rose/80 transition-colors underline decoration-rose/30';

    const tableHeadClass = isDark ? 'bg-gray-800/50' : 'bg-warm-200/50';
    const tableBorderClass = isDark ? 'border-gray-800' : 'border-warm-300';

    return (
        <>
            <SEOHead
                title="Política de Cookies"
                description="Política de cookies de Patry Closet. Información sobre las cookies que utilizamos conforme a la LSSI-CE y el RGPD."
                canonical="/cookies"
                jsonLd={breadcrumbs}
            />

            <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-gray-200' : 'bg-warm-100 text-gray-800'}`}>
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
                    <div className="max-w-4xl mx-auto py-12 sm:py-16">
                        {/* Breadcrumb */}
                        <nav aria-label="Breadcrumb" className="mb-8 text-sm">
                            <ol className="flex items-center gap-2">
                                <li><Link to="/" className="text-rose hover:text-rose/80 transition-colors">Inicio</Link></li>
                                <li className="text-gray-400">/</li>
                                <li className={isDark ? 'text-gray-400' : 'text-gray-500'}>Política de Cookies</li>
                            </ol>
                        </nav>

                        {/* Header */}
                        <div className="mb-12">
                            <Link to="/" className="inline-flex items-center gap-0.5 group mb-4">
                                <span className="text-xl font-bold tracking-tighter">PATRY</span>
                                <span className="text-rose text-xl transition-transform duration-300 group-hover:rotate-12">♡</span>
                                <span className="text-xl font-bold tracking-tighter">CLOSET</span>
                            </Link>
                            <span className="text-[11px] font-medium uppercase tracking-ultra-wide text-gray-400 mb-3 block">
                                Cookies
                            </span>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light tracking-tight text-gray-900 dark:text-white mb-3">
                                Política de Cookies
                            </h1>
                            <span className={`inline-block text-xs font-medium px-3 py-1 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-warm-200 text-gray-500'}`}>
                                Última actualización: 1 de abril de 2026
                            </span>
                        </div>

                        {/* Content */}
                        <div className="space-y-5">
                            {/* Section 1 */}
                            <div className={`border p-6 sm:p-8 ${cardClass}`}>
                                <h2 className="text-lg sm:text-xl font-serif font-medium mb-4 tracking-tight">1. ¿Qué son las Cookies?</h2>
                                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (ordenador, tablet o móvil) cuando visita un sitio web. Se utilizan para que el sitio funcione correctamente, para mejorar la experiencia de usuario y para recopilar información estadística sobre su uso.
                                </p>
                            </div>

                            {/* Section 2 */}
                            <div className={`border p-6 sm:p-8 ${cardClass}`}>
                                <h2 className="text-lg sm:text-xl font-serif font-medium mb-4 tracking-tight">2. Marco Legal</h2>
                                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Esta Política de Cookies cumple con la <strong>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE)</strong>, el <strong>Reglamento (UE) 2016/679 (RGPD)</strong> y las directrices de la <strong>Agencia Española de Protección de Datos (AEPD)</strong> sobre cookies.
                                </p>
                            </div>

                            {/* Section 3 — Cookie Tables */}
                            <div className={`border p-6 sm:p-8 ${cardClass}`}>
                                <h2 className="text-lg sm:text-xl font-serif font-medium mb-6 tracking-tight">3. Tipos de Cookies que Utilizamos</h2>

                                {/* Essential Cookies */}
                                <div className="mb-8">
                                    <h3 className={`text-base font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Cookies Estrictamente Necesarias
                                    </h3>
                                    <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Son esenciales para el funcionamiento del sitio web. No requieren consentimiento.</p>
                                    <div className={`overflow-x-auto border ${tableBorderClass}`}>
                                        <table className="w-full text-sm">
                                            <thead className={tableHeadClass}>
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Cookie</th>
                                                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Propósito</th>
                                                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Duración</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {[
                                                    ['cookie-consent', 'Almacena su preferencia de cookies', '12 meses'],
                                                    ['auth-token', 'Sesión de usuario autenticado', 'Sesión'],
                                                    ['cart-data', 'Contenido del carrito de compras', '30 días'],
                                                    ['theme-preference', 'Preferencia de tema (claro/oscuro)', '12 meses'],
                                                    ['i18nextLng', 'Preferencia de idioma', '12 meses'],
                                                ].map(([cookie, purpose, duration], i) => (
                                                    <tr key={cookie} className={`border-t ${tableBorderClass}`}>
                                                        <td className="px-4 py-3 font-mono text-xs">{cookie}</td>
                                                        <td className="px-4 py-3">{purpose}</td>
                                                        <td className="px-4 py-3">{duration}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Analytics Cookies */}
                                <div>
                                    <h3 className={`text-base font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                        <span className="w-2 h-2 rounded-full bg-rose inline-block" /> Cookies de Análisis
                                    </h3>
                                    <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nos ayudan a entender cómo interactúan los visitantes con el sitio. Requieren su consentimiento.</p>
                                    <div className={`overflow-x-auto border ${tableBorderClass}`}>
                                        <table className="w-full text-sm">
                                            <thead className={tableHeadClass}>
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Cookie</th>
                                                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Proveedor</th>
                                                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Propósito</th>
                                                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Duración</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                <tr className={`border-t ${tableBorderClass}`}>
                                                    <td className="px-4 py-3 font-mono text-xs">_ga</td>
                                                    <td className="px-4 py-3">Google</td>
                                                    <td className="px-4 py-3">Distinguir usuarios (Google Analytics 4)</td>
                                                    <td className="px-4 py-3">2 años</td>
                                                </tr>
                                                <tr className={`border-t ${tableBorderClass}`}>
                                                    <td className="px-4 py-3 font-mono text-xs">_ga_*</td>
                                                    <td className="px-4 py-3">Google</td>
                                                    <td className="px-4 py-3">Mantener estado de sesión (GA4)</td>
                                                    <td className="px-4 py-3">2 años</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4 */}
                            <div className={`border p-6 sm:p-8 ${cardClass}`}>
                                <h2 className="text-lg sm:text-xl font-serif font-medium mb-4 tracking-tight">4. Gestión de Cookies</h2>
                                <div className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <p className="mb-3">Puede gestionar sus preferencias de cookies en cualquier momento:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>Banner de cookies:</strong> al acceder al sitio, puede aceptar o rechazar las cookies no esenciales.</li>
                                        <li><strong>Configuración del navegador:</strong> puede bloquear o eliminar cookies desde la configuración de su navegador.</li>
                                        <li>
                                            <strong>Opt-out de Google Analytics:</strong>{' '}
                                            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className={linkClass}>
                                                Descargar complemento de inhabilitación
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 5 */}
                            <div className={`border p-6 sm:p-8 ${cardClass}`}>
                                <h2 className="text-lg sm:text-xl font-serif font-medium mb-4 tracking-tight">5. Más Información</h2>
                                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Para más información sobre cómo tratamos sus datos personales, consulte nuestra{' '}
                                    <Link to="/privacy" className={linkClass}>Política de Privacidad</Link>.
                                    Si tiene alguna pregunta sobre nuestra política de cookies, puede contactarnos en{' '}
                                    <a href="mailto:privacy@patrycloset.com" className={linkClass}>privacy@patrycloset.com</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <FooterSection />
            </div>
        </>
    );
};

export default CookiesPage;
