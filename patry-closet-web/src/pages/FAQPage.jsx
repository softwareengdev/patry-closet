import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import SEOHead, { getBreadcrumbSchema, getFAQSchema } from '../components/SEOHead';
import FooterSection from '../components/FooterSection';

const FAQ_SECTIONS = [
    {
        title: 'Pedidos y Compras',
        icon: '🛒',
        items: [
            {
                question: '¿Cómo realizo un pedido?',
                answer: 'Navega por nuestra tienda, selecciona los productos que deseas, elige la talla y el color, y añádelos al carrito. Cuando estés listo, haz clic en "Checkout" y sigue los pasos para completar tu compra con tarjeta de crédito/débito o PayPal.',
            },
            {
                question: '¿Puedo modificar o cancelar mi pedido?',
                answer: 'Puedes modificar o cancelar tu pedido dentro de las primeras 2 horas tras realizarlo. Contacta con nuestro equipo en support@patrycloset.com indicando tu número de pedido. Una vez que el pedido haya sido enviado, no podrá ser modificado.',
            },
            {
                question: '¿Los precios incluyen IVA?',
                answer: 'Sí, todos los precios mostrados en nuestra web incluyen el IVA aplicable según la legislación española vigente.',
            },
            {
                question: '¿Qué métodos de pago aceptáis?',
                answer: 'Aceptamos tarjetas Visa, Mastercard, American Express, PayPal, Apple Pay y Google Pay. Todos los pagos son procesados de forma segura a través de Stripe con certificación PCI DSS nivel 1.',
            },
        ],
    },
    {
        title: 'Envíos',
        icon: '📦',
        items: [
            {
                question: '¿Cuánto tarda el envío?',
                answer: 'España peninsular: 2-4 días laborables. Baleares y Canarias: 5-7 días laborables. Unión Europea: 5-10 días laborables. Los plazos pueden variar en periodos de alta demanda.',
            },
            {
                question: '¿Cuánto cuesta el envío?',
                answer: 'El envío es GRATUITO para pedidos superiores a 50€ en España peninsular. Para pedidos inferiores, el coste de envío es de 4,95€. Para envíos a Canarias, Baleares y otros países de la UE, el coste se calcula en el checkout.',
            },
            {
                question: '¿Puedo hacer seguimiento de mi pedido?',
                answer: 'Sí. Una vez que tu pedido haya sido enviado, recibirás un email con el número de seguimiento y un enlace directo para rastrear el paquete en tiempo real.',
            },
            {
                question: '¿Realizáis envíos internacionales?',
                answer: 'Actualmente realizamos envíos a todos los países de la Unión Europea. Estamos trabajando para ampliar nuestras zonas de envío. Suscríbete a nuestra newsletter para estar al día.',
            },
        ],
    },
    {
        title: 'Devoluciones y Cambios',
        icon: '🔄',
        items: [
            {
                question: '¿Cuál es la política de devoluciones?',
                answer: 'Tienes 14 días naturales desde la recepción del producto para devolver cualquier artículo. El producto debe estar sin usar, con sus etiquetas originales y en su embalaje original. Las devoluciones son gratuitas en España peninsular.',
            },
            {
                question: '¿Cómo solicito una devolución?',
                answer: 'Accede a tu cuenta, ve a "Mis Pedidos", selecciona el pedido y haz clic en "Solicitar devolución". Recibirás una etiqueta de envío prepagada por email. También puedes contactarnos en support@patrycloset.com.',
            },
            {
                question: '¿Cuándo recibiré mi reembolso?',
                answer: 'Una vez recibido y verificado el producto devuelto, procesaremos el reembolso en un plazo máximo de 14 días. El reembolso se realizará a través del mismo método de pago utilizado en la compra.',
            },
            {
                question: '¿Puedo cambiar un producto por otra talla o color?',
                answer: 'Sí. Puedes solicitar un cambio de talla o color siempre que el producto esté disponible. Contacta con nosotros en support@patrycloset.com y gestionaremos el cambio lo antes posible.',
            },
        ],
    },
    {
        title: 'Cuenta y Seguridad',
        icon: '🔐',
        items: [
            {
                question: '¿Necesito una cuenta para comprar?',
                answer: 'No es obligatorio, pero te recomendamos crear una cuenta para poder guardar tu lista de deseos, consultar el historial de pedidos, gestionar direcciones y acceder a ofertas exclusivas.',
            },
            {
                question: '¿Cómo protegéis mis datos personales?',
                answer: 'Cumplimos con el RGPD y la LOPDGDD. Utilizamos cifrado SSL/TLS, no almacenamos datos de tarjetas de crédito, y los pagos son procesados por Stripe (PCI DSS nivel 1). Para más información, consulta nuestra Política de Privacidad.',
            },
            {
                question: '¿He olvidado mi contraseña, qué hago?',
                answer: 'Haz clic en "¿Olvidaste tu contraseña?" en la página de inicio de sesión. Introduce tu email y recibirás un enlace para restablecer tu contraseña en pocos minutos.',
            },
        ],
    },
    {
        title: 'Tallas y Productos',
        icon: '👗',
        items: [
            {
                question: '¿Cómo sé qué talla elegir?',
                answer: 'Cada producto tiene una guía de tallas detallada con medidas en centímetros. Haz clic en "Guía de tallas" en la página del producto. Si tienes dudas, no dudes en contactarnos.',
            },
            {
                question: '¿Los colores son exactos en las fotos?',
                answer: 'Nos esforzamos por representar los colores lo más fielmente posible. Sin embargo, pueden existir ligeras variaciones dependiendo de la calibración de tu pantalla. Si tienes dudas sobre un color específico, contacta con nosotros.',
            },
            {
                question: '¿Puedo ser notificado cuando un producto agotado vuelva a estar disponible?',
                answer: 'Sí. En la página del producto agotado verás la opción "Avisarme cuando esté disponible". Introduce tu email y te notificaremos en cuanto el producto vuelva a tener stock.',
            },
        ],
    },
];

const FAQPage = () => {
    const { isDark } = useContext(ThemeContext);
    const { t } = useTranslation();
    const [openItems, setOpenItems] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const allFaqs = FAQ_SECTIONS.flatMap(s => s.items);
    const faqSchema = getFAQSchema(allFaqs);
    const breadcrumbs = getBreadcrumbSchema([
        { name: 'Inicio', url: '/' },
        { name: 'FAQ', url: '/faq' },
    ]);

    const toggleItem = (key) => {
        setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredSections = searchQuery.trim()
        ? FAQ_SECTIONS.map(section => ({
            ...section,
            items: section.items.filter(
                item =>
                    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        })).filter(section => section.items.length > 0)
        : FAQ_SECTIONS;

    const cardClass = isDark
        ? 'bg-gray-900 border-gray-800'
        : 'bg-warm-50 border-warm-400';

    return (
        <>
            <SEOHead
                title="Preguntas Frecuentes (FAQ)"
                description="Respuestas a las preguntas más frecuentes sobre pedidos, envíos, devoluciones, tallas y más en Patry Closet."
                canonical="/faq"
                jsonLd={[faqSchema, breadcrumbs]}
            />

            <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-gray-200' : 'bg-warm-100 text-gray-800'}`}>
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
                    <div className="max-w-4xl mx-auto py-12 sm:py-16">
                        {/* Breadcrumb */}
                        <nav aria-label="Breadcrumb" className="mb-8 text-sm">
                            <ol className="flex items-center gap-2">
                                <li><Link to="/" className="text-rose hover:text-rose/80 transition-colors">Inicio</Link></li>
                                <li className="text-gray-400">/</li>
                                <li className={isDark ? 'text-gray-400' : 'text-gray-500'}>FAQ</li>
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
                                Centro de Ayuda
                            </span>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light tracking-tight mb-3">
                                Preguntas Frecuentes
                            </h1>
                            <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Encuentra respuestas rápidas a las preguntas más comunes. ¿No encuentras lo que buscas?{' '}
                                <Link to="/#contact" className="text-rose hover:text-rose/80 transition-colors">Contáctanos</Link>.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative mb-10">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar en las preguntas frecuentes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border transition-colors text-sm ${
                                    isDark
                                        ? 'bg-gray-900 border-gray-800 focus:border-rose placeholder-gray-500 text-gray-200'
                                        : 'bg-warm-50 border-warm-400 focus:border-accent-900 placeholder-gray-400 text-gray-800'
                                } focus:outline-none focus:ring-2 focus:ring-rose/20`}
                            />
                        </div>

                        {filteredSections.length === 0 && (
                            <div className={`text-center py-12 rounded-xl border ${cardClass}`}>
                                <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                                    No se encontraron resultados para "{searchQuery}".
                                </p>
                            </div>
                        )}

                        {filteredSections.map((section) => (
                            <div key={section.title} className="mb-10">
                                <h2 className="text-lg font-serif font-medium mb-4 flex items-center gap-3">
                                    <span className="text-xl">{section.icon}</span>
                                    <span>{section.title}</span>
                                </h2>
                                <div className="space-y-3">
                                    {section.items.map((item) => {
                                        const key = `${section.title}-${item.question}`;
                                        const isOpen = openItems[key];
                                        return (
                                            <div
                                                key={key}
                                                className={`rounded-xl border overflow-hidden transition-all ${
                                                    isOpen
                                                        ? isDark ? 'border-gray-700 bg-gray-900' : 'border-warm-500 bg-warm-50'
                                                        : isDark ? 'border-gray-800 bg-gray-900/50' : 'border-warm-400 bg-warm-50'
                                                }`}
                                            >
                                                <button
                                                    onClick={() => toggleItem(key)}
                                                    className={`w-full flex items-center justify-between px-5 py-4 text-left font-medium text-sm transition-colors ${
                                                        isDark ? 'hover:bg-gray-800/50' : 'hover:bg-warm-200/50'
                                                    }`}
                                                    aria-expanded={isOpen}
                                                >
                                                    <span className="pr-4">{item.question}</span>
                                                    {isOpen
                                                        ? <ChevronUp className="w-5 h-5 shrink-0 text-rose" />
                                                        : <ChevronDown className="w-5 h-5 shrink-0 text-gray-400" />
                                                    }
                                                </button>
                                                {isOpen && (
                                                    <div className={`px-5 pb-5 text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {item.answer}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* CTA */}
                        <div className={`mt-12 p-8 sm:p-10 rounded-2xl text-center border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-warm-50 border-warm-400'}`}>
                            <h3 className="text-xl font-serif font-medium mb-2">¿No encuentras tu respuesta?</h3>
                            <p className={`mb-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Nuestro equipo está listo para ayudarte.
                            </p>
                            <Link
                                to="/#contact"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-accent-900 text-white rounded-full hover:bg-accent-800 transition-colors font-medium text-sm"
                            >
                                Contactar Soporte
                            </Link>
                        </div>
                    </div>
                </div>
                <FooterSection />
            </div>
        </>
    );
};

export default FAQPage;
