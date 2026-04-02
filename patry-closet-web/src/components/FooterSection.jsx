import { useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { FaInstagram, FaFacebook, FaTiktok, FaCcVisa, FaCcMastercard, FaCcPaypal, FaCcApplePay, FaCcStripe } from 'react-icons/fa';
import { ThemeContext } from '../context/ThemeContext';

const BLOG_POSTS = [
    {
        id: 1,
        slug: 'fall-2026-fashion-trends-you-need-to-know',
        titleKey: 'footer.blogTitle1',
        titleFallback: 'Fall 2026 Fashion Trends',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=500&q=80',
        excerptKey: 'footer.blogExcerpt1',
        excerptFallback: 'Discover the latest color and style trends for the season.',
    },
    {
        id: 2,
        slug: 'complete-event-dressing-guide-weddings-galas-parties',
        titleKey: 'footer.blogTitle2',
        titleFallback: 'Event Style Guide',
        image: 'https://images.unsplash.com/photo-1529139574466-a303d20ff24f?auto=format&fit=crop&w=500&q=80',
        excerptKey: 'footer.blogExcerpt2',
        excerptFallback: 'Tips for dressing at weddings, parties and galas.',
    },
    {
        id: 3,
        slug: 'sustainable-fashion-guide-building-conscious-wardrobe',
        titleKey: 'footer.blogTitle3',
        titleFallback: 'Sustainability in Fashion',
        image: 'https://images.unsplash.com/photo-1520974735194-8d95cdf6d2ef?auto=format&fit=crop&w=500&q=80',
        excerptKey: 'footer.blogExcerpt3',
        excerptFallback: 'How Patry Closet promotes eco-friendly fashion.',
    },
];

const SOCIAL_LINKS = [
    { icon: FaInstagram, href: 'https://instagram.com/patrycloset', label: 'Instagram' },
    { icon: FaFacebook, href: 'https://facebook.com/patrycloset', label: 'Facebook' },
    { icon: FaTiktok, href: 'https://tiktok.com/@patrycloset', label: 'TikTok' },
];

const FOOTER_LINKS = [
    { labelKey: 'blog', fallback: 'Blog', to: '/blog' },
    { labelKey: 'privacyPolicy', fallback: 'Privacy Policy', to: '/privacy' },
    { labelKey: 'termsOfService', fallback: 'Terms of Service', to: '/terms' },
    { labelKey: 'faq', fallback: 'FAQ', to: '/faq' },
];

const PAYMENT_ICONS = [
    { icon: FaCcVisa, label: 'Visa' },
    { icon: FaCcMastercard, label: 'Mastercard' },
    { icon: FaCcPaypal, label: 'PayPal' },
    { icon: FaCcApplePay, label: 'Apple Pay' },
    { icon: FaCcStripe, label: 'Stripe' },
];

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const FooterSection = () => {
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-60px' });

    return (
        <footer
            ref={ref}
            className={`py-16 sm:py-20 border-t ${
                isDark
                    ? 'bg-gray-950 border-gray-900'
                    : 'bg-warm-200 border-warm-400'
            }`}
            role="contentinfo"
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* ─── Top: Blog Highlights ─── */}
                <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                    className="mb-14"
                >
                    <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold">{t('ourBlog', 'Our Blog')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {t('footer.blogSubtitle', 'Style tips, trends and behind the scenes')}
                            </p>
                        </div>
                        <Link
                            to="/blog"
                            className={`hidden sm:flex items-center gap-1 text-sm font-medium transition-colors ${
                                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                            }`}
                        >
                            {t('viewAll', 'View All')}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {BLOG_POSTS.map(post => (
                            <motion.article
                                key={post.id}
                                variants={fadeUp}
                                className={`group rounded-xl overflow-hidden border transition-all hover:shadow-lg ${
                                    isDark
                                        ? 'bg-gray-900 border-gray-800 hover:border-gray-700'
                                        : 'bg-warm-50 border-warm-400 hover:border-warm-500'
                                }`}
                            >
                                <div className="aspect-[16/10] overflow-hidden">
                                    <img
                                        src={post.image}
                                        alt={t(post.titleKey, post.titleFallback)}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="p-4">
                                    <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                                        {t(post.titleKey, post.titleFallback)}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                        {t(post.excerptKey, post.excerptFallback)}
                                    </p>
                                    <Link
                                        to={`/blog/${post.slug}`}
                                        className={`text-xs font-medium inline-flex items-center gap-1 transition-colors ${
                                            isDark ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-700'
                                        }`}
                                    >
                                        {t('readMore', 'Read More')}
                                        <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </motion.div>

                {/* ─── Middle: Divider with newsletter teaser ─── */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-y mb-10 ${
                        isDark ? 'border-gray-800' : 'border-warm-400'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-warm-300'}`}>
                            <Mail className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{t('footer.newsletterTitle', 'Stay in the loop')}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('footer.newsletterSubtitle', 'Get early access to sales and new arrivals')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                            type="email"
                            placeholder={t('footer.emailPlaceholder', 'Your email')}
                            className={`flex-1 sm:w-56 px-4 py-2.5 rounded-lg border text-sm bg-transparent focus:outline-none ${
                                isDark
                                    ? 'border-gray-700 focus:border-white placeholder-gray-600'
                                    : 'border-warm-500 focus:border-black placeholder-gray-400'
                            }`}
                            aria-label={t('footer.emailPlaceholder', 'Your email')}
                        />
                        <button className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isDark
                                ? 'bg-warm-50 text-black hover:bg-warm-300'
                                : 'bg-black text-white hover:bg-gray-900'
                        }`}>
                            {t('footer.subscribe', 'Subscribe')}
                        </button>
                    </div>
                </motion.div>

                {/* ─── Bottom: Payment + Links + Social + Copyright ─── */}
                <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-start"
                >
                    {/* Brand + Social */}
                    <motion.div variants={fadeUp}>
                        <Link to="/" className="flex items-center gap-0.5 mb-3 group">
                            <span className="text-xl font-bold tracking-tighter">PATRY</span>
                            <span className="text-rose text-xl transition-transform duration-300 group-hover:rotate-12">♡</span>
                            <span className="text-xl font-bold tracking-tighter">CLOSET</span>
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
                            {t('footer.brandDesc', 'Curated fashion for the modern woman. Timeless elegance meets contemporary design.')}
                        </p>
                        <div className="flex items-center gap-2">
                            {SOCIAL_LINKS.map(s => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={s.label}
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                                        isDark
                                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                                            : 'bg-warm-300 hover:bg-warm-400 text-gray-500 hover:text-gray-900'
                                    }`}
                                >
                                    <s.icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div variants={fadeUp}>
                        <h4 className="text-sm font-semibold mb-3">{t('footer.quickLinks', 'Quick Links')}</h4>
                        <ul className="space-y-2">
                            {FOOTER_LINKS.map(link => (
                                <li key={link.to}>
                                    <Link
                                        to={link.to}
                                        className={`text-sm transition-colors ${
                                            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                                        }`}
                                    >
                                        {t(link.labelKey, link.fallback)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Payment Methods */}
                    <motion.div variants={fadeUp}>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                            {t('securePayments', 'Secure Payment Methods')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {PAYMENT_ICONS.map(pm => (
                                <div
                                    key={pm.label}
                                    className={`w-12 h-8 rounded flex items-center justify-center text-xl ${
                                        isDark ? 'bg-gray-800 text-gray-400' : 'bg-warm-300 text-gray-500'
                                    }`}
                                    aria-label={pm.label}
                                >
                                    <pm.icon />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>

                {/* Copyright */}
                <div className={`mt-10 pt-6 border-t text-center ${isDark ? 'border-gray-800' : 'border-warm-400'}`}>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        © {new Date().getFullYear()} Patry Closet. {t('footer.allRightsReserved', 'All rights reserved.')}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default FooterSection;
