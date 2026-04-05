import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import SEOHead, { getBreadcrumbSchema } from '../components/SEOHead';
import FooterSection from '../components/FooterSection';

const PrivacyPage = () => {
    const { isDark } = useContext(ThemeContext);
    const { t } = useTranslation();

    const breadcrumbs = getBreadcrumbSchema([
        { name: 'Inicio', url: '/' },
        { name: 'Política de Privacidad', url: '/privacy' },
    ]);

    const cardClass = isDark
        ? 'bg-gray-900 border-gray-800 hover:border-gray-700 transition-all'
        : 'bg-warm-50 border-warm-400 hover:border-warm-500 transition-all';

    const linkClass = 'text-rose hover:text-rose/80 transition-colors underline decoration-rose/30';

    const sections = [
        {
            title: '1. Responsable del Tratamiento',
            content: (
                <>
                    <p className="mb-3 leading-relaxed">
                        El responsable del tratamiento de sus datos personales es <strong>Patry Closet</strong>, con domicilio social en Madrid, España.
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Email de contacto:</strong> <a href="mailto:privacy@patrycloset.com" className={linkClass}>privacy@patrycloset.com</a></li>
                        <li><strong>Sitio web:</strong> patrycloset.com</li>
                    </ul>
                </>
            ),
        },
        {
            title: '2. Datos que Recopilamos',
            content: (
                <>
                    <p className="mb-3 leading-relaxed">
                        De conformidad con el Reglamento General de Protección de Datos (RGPD) (UE) 2016/679 y la Ley Orgánica 3/2018 (LOPDGDD), le informamos que recopilamos los siguientes datos:
                    </p>
                    <h3 className={`text-base font-medium mt-5 mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Datos proporcionados directamente:</h3>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Nombre y apellidos</li>
                        <li>Dirección de correo electrónico</li>
                        <li>Dirección postal (para envíos)</li>
                        <li>Número de teléfono</li>
                        <li>Datos de pago (procesados por Stripe de forma segura; no almacenamos datos de tarjeta)</li>
                    </ul>
                    <h3 className={`text-base font-medium mt-5 mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Datos recopilados automáticamente:</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Dirección IP (anonimizada)</li>
                        <li>Tipo de navegador y dispositivo</li>
                        <li>Páginas visitadas y tiempo de permanencia</li>
                        <li>Datos de cookies (ver nuestra <Link to="/cookies" className={linkClass}>Política de Cookies</Link>)</li>
                    </ul>
                </>
            ),
        },
        {
            title: '3. Finalidad del Tratamiento',
            content: (
                <>
                    <p className="mb-3 leading-relaxed">Sus datos personales serán tratados para las siguientes finalidades:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Gestión de pedidos:</strong> procesamiento, envío y seguimiento de sus compras.</li>
                        <li><strong>Gestión de cuenta:</strong> creación y mantenimiento de su cuenta de usuario.</li>
                        <li><strong>Comunicaciones:</strong> responder a sus consultas y enviar notificaciones sobre sus pedidos.</li>
                        <li><strong>Marketing:</strong> envío de newsletters y ofertas personalizadas (solo con su consentimiento explícito).</li>
                        <li><strong>Análisis:</strong> mejora de nuestros servicios mediante análisis estadístico anonimizado (Google Analytics 4).</li>
                        <li><strong>Cumplimiento legal:</strong> obligaciones fiscales y contables conforme a la legislación española.</li>
                    </ul>
                </>
            ),
        },
        {
            title: '4. Base Legal del Tratamiento',
            content: (
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Ejecución contractual</strong> (art. 6.1.b RGPD): para gestionar sus pedidos y cuenta.</li>
                    <li><strong>Consentimiento</strong> (art. 6.1.a RGPD): para comunicaciones de marketing y cookies no esenciales.</li>
                    <li><strong>Interés legítimo</strong> (art. 6.1.f RGPD): para análisis y mejora del servicio.</li>
                    <li><strong>Obligación legal</strong> (art. 6.1.c RGPD): para cumplimiento de obligaciones fiscales.</li>
                </ul>
            ),
        },
        {
            title: '5. Destinatarios de los Datos',
            content: (
                <>
                    <p className="mb-3 leading-relaxed">Sus datos podrán ser comunicados a los siguientes destinatarios:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Stripe Inc.</strong> — procesamiento seguro de pagos (certificación PCI DSS).</li>
                        <li><strong>Empresas de transporte</strong> — para la entrega de pedidos.</li>
                        <li><strong>Google LLC</strong> — análisis web (Google Analytics 4), con datos anonimizados.</li>
                        <li><strong>Cloudflare Inc.</strong> — alojamiento web y CDN.</li>
                        <li><strong>Administraciones públicas</strong> — cuando sea requerido por ley.</li>
                    </ul>
                    <p className="mt-3 leading-relaxed">
                        Algunos de estos proveedores pueden transferir datos fuera del EEE. En tal caso, se garantizan las salvaguardas adecuadas mediante Cláusulas Contractuales Tipo aprobadas por la Comisión Europea.
                    </p>
                </>
            ),
        },
        {
            title: '6. Sus Derechos (RGPD)',
            content: (
                <>
                    <p className="mb-3 leading-relaxed">Usted tiene los siguientes derechos sobre sus datos personales:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Acceso:</strong> obtener una copia de sus datos personales.</li>
                        <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
                        <li><strong>Supresión:</strong> solicitar la eliminación de sus datos ("derecho al olvido").</li>
                        <li><strong>Limitación:</strong> restringir el tratamiento de sus datos.</li>
                        <li><strong>Portabilidad:</strong> recibir sus datos en formato estructurado y legible por máquina.</li>
                        <li><strong>Oposición:</strong> oponerse al tratamiento de sus datos, incluida la elaboración de perfiles.</li>
                    </ul>
                    <p className="mt-3 leading-relaxed">
                        Para ejercer cualquiera de estos derechos, contacte con nosotros en{' '}
                        <a href="mailto:privacy@patrycloset.com" className={linkClass}>privacy@patrycloset.com</a>.
                        Responderemos en un plazo máximo de 30 días.
                    </p>
                    <p className="mt-3 leading-relaxed">
                        Asimismo, tiene derecho a presentar una reclamación ante la <strong>Agencia Española de Protección de Datos</strong> (AEPD):{' '}
                        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className={linkClass}>www.aepd.es</a>
                    </p>
                </>
            ),
        },
        {
            title: '7. Conservación de Datos',
            content: (
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Datos de compra:</strong> 5 años (obligación fiscal española).</li>
                    <li><strong>Datos de cuenta:</strong> mientras la cuenta esté activa + 2 años tras la baja.</li>
                    <li><strong>Datos de marketing:</strong> hasta que revoque su consentimiento.</li>
                    <li><strong>Datos de navegación:</strong> 26 meses (configuración de Google Analytics).</li>
                </ul>
            ),
        },
        {
            title: '8. Seguridad',
            content: (
                <p className="leading-relaxed">
                    Implementamos medidas técnicas y organizativas adecuadas para proteger sus datos personales, incluyendo cifrado SSL/TLS, control de acceso, y auditorías periódicas. Los datos de pago son procesados por Stripe con certificación PCI DSS nivel 1.
                </p>
            ),
        },
        {
            title: '9. Menores de Edad',
            content: (
                <p className="leading-relaxed">
                    Nuestros servicios no están dirigidos a menores de 16 años. No recopilamos conscientemente datos de menores sin el consentimiento de sus padres o tutores legales, conforme al artículo 8 del RGPD y el artículo 7 de la LOPDGDD.
                </p>
            ),
        },
        {
            title: '10. Contacto',
            content: (
                <p className="leading-relaxed">
                    Para cualquier consulta sobre esta Política de Privacidad, puede contactarnos en:{' '}
                    <a href="mailto:privacy@patrycloset.com" className={linkClass}>privacy@patrycloset.com</a>
                </p>
            ),
        },
    ];

    return (
        <>
            <SEOHead
                title="Política de Privacidad"
                description="Política de privacidad de Patry Closet. Información sobre el tratamiento de datos personales conforme al RGPD y la LOPDGDD."
                canonical="/privacy"
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
                                <li className={isDark ? 'text-gray-400' : 'text-gray-500'}>Política de Privacidad</li>
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
                                Privacidad
                            </span>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light tracking-tight text-gray-900 dark:text-white mb-3">
                                Política de Privacidad
                            </h1>
                            <span className={`inline-block text-xs font-medium px-3 py-1 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-warm-200 text-gray-500'}`}>
                                Última actualización: 1 de abril de 2026
                            </span>
                        </div>

                        {/* Content Sections */}
                        <div className="space-y-5">
                            {sections.map((section, i) => (
                                <div key={i} className={`border p-6 sm:p-8 ${cardClass}`}>
                                    <h2 className="text-lg sm:text-xl font-serif font-medium mb-4 tracking-tight">
                                        {section.title}
                                    </h2>
                                    <div className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {section.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <FooterSection />
            </div>
        </>
    );
};

export default PrivacyPage;
