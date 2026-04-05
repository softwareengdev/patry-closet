import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import SEOHead, { getBreadcrumbSchema } from '../components/SEOHead';
import FooterSection from '../components/FooterSection';

const SECTIONS = [
    {
        title: '1. Información General',
        content: (
            <>
                <p className="mb-3 leading-relaxed">
                    El presente sitio web <strong>patrycloset.com</strong> (en adelante, "el Sitio") es propiedad y está operado por <strong>Patry Closet</strong> (en adelante, "la Empresa"), con domicilio social en Madrid, España.
                </p>
                <p className="leading-relaxed">
                    El acceso y uso de este Sitio implica la aceptación plena y sin reservas de los presentes Términos y Condiciones de Uso. Si no está de acuerdo con alguno de estos términos, le rogamos que no utilice este Sitio.
                </p>
            </>
        ),
    },
    {
        title: '2. Condiciones de Compra',
        content: (
            <>
                <p className="mb-3 leading-relaxed">
                    Para realizar una compra en el Sitio, el usuario debe ser mayor de 18 años o contar con autorización de su tutor legal. Todos los precios mostrados incluyen IVA conforme a la legislación española vigente.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Los precios están expresados en Euros (€) e incluyen el IVA aplicable.</li>
                    <li>Los gastos de envío se mostrarán antes de confirmar el pedido.</li>
                    <li>La Empresa se reserva el derecho de modificar los precios en cualquier momento sin previo aviso.</li>
                    <li>Una vez confirmado el pedido, se enviará un correo electrónico de confirmación con el resumen del mismo.</li>
                </ul>
            </>
        ),
    },
    {
        title: '3. Envíos y Entregas',
        content: (
            <>
                <p className="mb-3 leading-relaxed">
                    Los envíos se realizan a través de empresas de transporte de confianza. Los plazos de entrega estimados son:
                </p>
                <ul className="list-disc pl-6 mb-3 space-y-2">
                    <li><strong>España peninsular:</strong> 2-4 días laborables.</li>
                    <li><strong>Baleares y Canarias:</strong> 5-7 días laborables.</li>
                    <li><strong>Unión Europea:</strong> 5-10 días laborables.</li>
                    <li><strong>Envío gratuito</strong> en pedidos superiores a 50€ (España peninsular).</li>
                </ul>
                <p className="leading-relaxed">
                    Los plazos de entrega son estimaciones y no constituyen un compromiso contractual. La Empresa no será responsable de retrasos causados por circunstancias ajenas a su control.
                </p>
            </>
        ),
    },
    {
        title: '4. Devoluciones y Reembolsos',
        content: (
            <>
                <p className="mb-3 leading-relaxed">
                    De conformidad con la legislación española (Real Decreto Legislativo 1/2007), el usuario tiene derecho a desistir de su compra en un plazo de <strong>14 días naturales</strong> desde la recepción del producto, sin necesidad de justificación.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>El producto debe estar sin usar, con sus etiquetas originales y en su embalaje original.</li>
                    <li>Los costes de devolución correrán a cargo del cliente, salvo que el producto sea defectuoso.</li>
                    <li>El reembolso se efectuará en un plazo máximo de 14 días desde la recepción del producto devuelto.</li>
                    <li>El reembolso se realizará a través del mismo método de pago utilizado en la compra.</li>
                </ul>
            </>
        ),
    },
    {
        title: '5. Propiedad Intelectual',
        content: (
            <>
                <p className="mb-3 leading-relaxed">
                    Todos los contenidos del Sitio, incluyendo pero no limitado a textos, imágenes, logotipos, diseños gráficos, iconos, fotografías, software y código fuente, están protegidos por las leyes españolas e internacionales de propiedad intelectual e industrial.
                </p>
                <p className="leading-relaxed">
                    Queda prohibida la reproducción, distribución, comunicación pública o transformación de dichos contenidos sin la autorización expresa y por escrito de la Empresa. El uso no autorizado de estos contenidos podrá dar lugar a las acciones legales correspondientes.
                </p>
            </>
        ),
    },
    {
        title: '6. Garantías',
        content: (
            <p className="leading-relaxed">
                De acuerdo con la legislación española vigente (Real Decreto-ley 7/2021), todos los productos vendidos cuentan con una garantía legal de <strong>3 años</strong> para productos nuevos. En caso de producto defectuoso, el consumidor tiene derecho a la reparación, sustitución, reducción del precio o resolución del contrato.
            </p>
        ),
    },
    {
        title: '7. Limitación de Responsabilidad',
        content: (
            <p className="leading-relaxed">
                La Empresa no será responsable de los daños y perjuicios de cualquier naturaleza que pudieran derivarse del uso del Sitio, incluyendo errores u omisiones en los contenidos, falta de disponibilidad del portal, o la transmisión de virus o programas maliciosos. La Empresa se reserva el derecho de suspender, modificar o restringir el acceso al Sitio sin previo aviso.
            </p>
        ),
    },
    {
        title: '8. Resolución de Conflictos',
        content: (isDark) => (
            <>
                <p className="mb-3 leading-relaxed">
                    Para cualquier reclamación, el usuario puede contactar con nuestro servicio de atención al cliente a través de <a href="mailto:legal@patrycloset.com" className="text-rose hover:text-rose/80 transition-colors underline decoration-rose/30">legal@patrycloset.com</a>.
                </p>
                <p className="mb-3 leading-relaxed">
                    Conforme al Reglamento (UE) 524/2013, le informamos de que la Comisión Europea facilita una plataforma de resolución de litigios en línea disponible en:{' '}
                    <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-rose hover:text-rose/80 transition-colors underline decoration-rose/30">
                        https://ec.europa.eu/consumers/odr
                    </a>
                </p>
                <p className="leading-relaxed">
                    Estos Términos se rigen por la legislación española. Cualquier controversia será sometida a los Juzgados y Tribunales del domicilio del consumidor, conforme a la normativa vigente.
                </p>
            </>
        ),
    },
    {
        title: '9. Modificaciones',
        content: (
            <p className="leading-relaxed">
                La Empresa se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones entrarán en vigor desde su publicación en el Sitio. Se recomienda al usuario revisar periódicamente esta página.
            </p>
        ),
    },
];

const TermsPage = () => {
    const { isDark } = useContext(ThemeContext);
    const { t } = useTranslation();

    const breadcrumbs = getBreadcrumbSchema([
        { name: 'Inicio', url: '/' },
        { name: 'Términos y Condiciones', url: '/terms' },
    ]);

    const cardClass = isDark
        ? 'bg-gray-900 border-gray-800 hover:border-gray-700 transition-all'
        : 'bg-warm-50 border-warm-400 hover:border-warm-500 transition-all';

    return (
        <>
            <SEOHead
                title="Términos y Condiciones"
                description="Términos y condiciones de uso de Patry Closet. Información sobre compras, devoluciones, envíos y responsabilidades."
                canonical="/terms"
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
                                <li className={isDark ? 'text-gray-400' : 'text-gray-500'}>Términos y Condiciones</li>
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
                                Legal
                            </span>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light tracking-tight text-gray-900 dark:text-white mb-3">
                                Términos y Condiciones
                            </h1>
                            <span className={`inline-block text-xs font-medium px-3 py-1 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-warm-200 text-gray-500'}`}>
                                Última actualización: 1 de abril de 2026
                            </span>
                        </div>

                        {/* Content Sections */}
                        <div className="space-y-5">
                            {SECTIONS.map((section, i) => (
                                <div key={i} className={`border p-6 sm:p-8 ${cardClass}`}>
                                    <h2 className="text-lg sm:text-xl font-serif font-medium mb-4 tracking-tight">
                                        {section.title}
                                    </h2>
                                    <div className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {typeof section.content === 'function' ? section.content(isDark) : section.content}
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

export default TermsPage;
