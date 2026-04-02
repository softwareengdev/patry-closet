import { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Mail, Phone, MapPin, Send, Clock, MessageCircle,
    AlertCircle, CheckCircle, X, ImagePlus, Loader2,
    ChevronDown, Sparkles, ArrowRight, Paperclip, Shield,
} from 'lucide-react';
import { FaWhatsapp, FaInstagram, FaFacebook, FaTiktok } from 'react-icons/fa';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

/* ─── Constants ─── */
const MAX_MESSAGE_LENGTH = 2000;
const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const WHATSAPP_NUMBER = '34912345678';
const CONTACT_EMAIL = 'info@patrycloset.com';
const CONTACT_PHONE = '+34 912 345 678';
const CONTACT_ADDRESS = 'Gran Vía 42, 28013 Madrid, España';

const SUBJECT_KEYS = [
    'product',
    'sizing',
    'influencer',
    'press',
    'sustainability',
    'returns',
    'other',
];

/* ─── reCAPTCHA v3 (invisible) ─── */
const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Google test key

const loadRecaptchaScript = () => {
    if (document.getElementById('recaptcha-v3-script')) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'recaptcha-v3-script';
        script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

const getRecaptchaToken = async (action = 'contact_submit') => {
    try {
        await loadRecaptchaScript();
        if (!window.grecaptcha) return null;
        return await new Promise(resolve => {
            window.grecaptcha.ready(() => {
                window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action }).then(resolve).catch(() => resolve(null));
            });
        });
    } catch {
        return null;
    }
};

/* ─── Push Notification (PWA) ─── */
const sendPushNotification = async (title, body) => {
    try {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
        if (Notification.permission === 'granted') {
            const reg = await navigator.serviceWorker?.ready;
            if (reg) {
                reg.showNotification(title, {
                    body,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    tag: 'contact-form',
                    vibrate: [100, 50, 100],
                });
            } else {
                new Notification(title, { body });
            }
        }
    } catch { /* Notification not critical */ }
};

/* ─── Contact API (mock → will connect to .NET backend) ─── */
const submitContactForm = async ({ formData, attachments, recaptchaToken }) => {
    // Simulate API call with FormData
    const payload = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
        if (key !== 'honeypot') payload.append(key, val);
    });
    if (recaptchaToken) payload.append('recaptchaToken', recaptchaToken);
    attachments.forEach((file, i) => payload.append(`attachment_${i}`, file));

    // Mock network delay — replace with: await axios.post('/api/contact', payload)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock: 5% chance of failure for realistic error handling
    if (Math.random() < 0.05) throw new Error('Network error');

    return { success: true, ticketId: `PC-${Date.now().toString(36).toUpperCase()}` };
};

/* ─── Zod Schema ─── */
const createContactSchema = (t) => z.object({
    name: z.string().min(2, t('contact.validation.nameMin', 'Name must be at least 2 characters')),
    email: z.string().email(t('contact.validation.emailInvalid', 'Please enter a valid email')),
    phone: z.string()
        .optional()
        .refine(
            val => !val || /^\+?[\d\s\-()]{7,}$/.test(val),
            t('contact.validation.phoneInvalid', 'Please enter a valid phone number'),
        ),
    subject: z.string().min(1, t('contact.validation.subjectRequired', 'Please select a subject')),
    message: z.string()
        .min(10, t('contact.validation.messageMin', 'Message must be at least 10 characters'))
        .max(MAX_MESSAGE_LENGTH, t('contact.validation.messageMax', `Maximum ${MAX_MESSAGE_LENGTH} characters`)),
    honeypot: z.string().max(0),
});

/* ─── Animations ─── */
const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── Contact Method Card ─── */
const ContactMethod = ({ icon: Icon, label, value, href, accent, isDark }) => (
    <motion.a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${
            isDark
                ? 'border-gray-800 hover:border-gray-700 bg-gray-900/50 hover:bg-gray-900'
                : 'border-warm-400 hover:border-warm-500 bg-warm-50 hover:bg-warm-200'
        }`}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
    >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{label}</p>
            <p className="text-sm font-semibold truncate">{value}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors shrink-0" />
    </motion.a>
);

/* ─── Image Preview ─── */
const ImagePreview = ({ file, onRemove, index }) => {
    const [preview, setPreview] = useState(null);
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative group w-20 h-20 rounded-lg overflow-hidden"
        >
            {preview && <img src={preview} alt={`Attachment ${index + 1}`} className="w-full h-full object-cover" />}
            <button
                type="button"
                onClick={onRemove}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                aria-label={`Remove attachment ${index + 1}`}
            >
                <X className="w-5 h-5 text-white" />
            </button>
        </motion.div>
    );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

const ContactSection = () => {
    const { t } = useTranslation();
    const { isDark, isHighContrast } = useContext(ThemeContext);
    const { user, isAuthenticated } = useAuth();
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
    const fileInputRef = useRef(null);

    const [attachments, setAttachments] = useState([]);
    const [submitState, setSubmitState] = useState('idle'); // idle | sending | success | error
    const [ticketId, setTicketId] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const mapRef = useRef(null);
    const mapInView = useInView(mapRef, { once: true, margin: '200px' });

    // Load reCAPTCHA script on mount
    useEffect(() => {
        loadRecaptchaScript().catch(() => {});
    }, []);

    // Lazy-load the map when it comes near viewport
    useEffect(() => {
        if (mapInView && !mapLoaded) setMapLoaded(true);
    }, [mapInView, mapLoaded]);

    const schema = createContactSchema(t);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name: isAuthenticated ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : '',
            email: isAuthenticated ? user?.email || '' : '',
            phone: isAuthenticated ? user?.phone || '' : '',
            subject: '',
            message: '',
            honeypot: '',
        },
    });

    const messageValue = watch('message', '');
    const charCount = messageValue?.length || 0;

    /* ─── File attachment handler ─── */
    const handleFileChange = useCallback((e) => {
        const files = Array.from(e.target.files || []);
        const valid = files.filter(f =>
            ACCEPTED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE,
        );
        setAttachments(prev => [...prev, ...valid].slice(0, MAX_ATTACHMENTS));
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const removeAttachment = useCallback((index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    }, []);

    /* ─── React Query mutation for form submission ─── */
    const contactMutation = useMutation({
        mutationFn: submitContactForm,
        onMutate: () => {
            setSubmitState('sending');
        },
        onSuccess: (result) => {
            // Analytics event (GA4-ready)
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'contact_form_submit', {
                    event_category: 'engagement',
                    event_label: watch('subject'),
                    ticket_id: result.ticketId,
                });
            }

            setTicketId(result.ticketId);
            setSubmitState('success');
            setAttachments([]);
            reset({
                name: isAuthenticated ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : '',
                email: isAuthenticated ? user?.email || '' : '',
                phone: '',
                subject: '',
                message: '',
                honeypot: '',
            });

            // Push notification (PWA)
            sendPushNotification(
                t('contact.pushTitle', '✅ Message Sent — Patry Closet'),
                t('contact.pushBody', 'We received your message and will reply within 2 hours.'),
            );
        },
        onError: () => {
            setSubmitState('error');
        },
    });

    /* ─── Form submission with reCAPTCHA ─── */
    const onSubmit = async (data) => {
        if (data.honeypot) return; // Bot detected

        // Get reCAPTCHA token (non-blocking — fails gracefully)
        const recaptchaToken = await getRecaptchaToken('contact_submit');

        contactMutation.mutate({
            formData: data,
            attachments,
            recaptchaToken,
        });
    };

    const handleNewMessage = () => {
        setSubmitState('idle');
    };

    /* ─── WhatsApp URL ─── */
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        t('contact.whatsappMessage', 'Hello Patry Closet, I have a question about…'),
    )}`;

    /* ─── Input classes ─── */
    const inputBase = `w-full px-4 py-3 rounded-xl border-2 transition-all bg-transparent focus:outline-none focus:ring-0 text-sm ${
        isDark
            ? 'border-gray-800 focus:border-white placeholder-gray-600'
            : 'border-warm-400 focus:border-black placeholder-gray-400'
    }`;
    const inputError = isDark
        ? 'border-red-700 focus:border-red-500'
        : 'border-red-300 focus:border-red-500';

    return (
        <section
            ref={sectionRef}
            id="contact"
            className={`relative py-20 sm:py-28 overflow-hidden ${
                isDark
                    ? 'bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950'
                    : 'bg-gradient-to-b from-gray-50 via-white to-gray-50'
            }`}
            aria-labelledby="contact-heading"
        >
            {/* Decorative background elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-pink-900/10' : 'bg-pink-100/60'}`} />
                <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-indigo-900/10' : 'bg-indigo-100/40'}`} />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
                {/* ─── Section Header ─── */}
                <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={stagger}
                    className="text-center mb-12 sm:mb-16"
                >
                    <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300">
                        <Sparkles className="w-3 h-3" />
                        {t('contact.badge', 'We\'re here to help')}
                    </motion.div>
                    <motion.h2
                        id="contact-heading"
                        variants={fadeUp}
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
                    >
                        {t('contact.title', 'How can we help you?')}
                    </motion.h2>
                    <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-base sm:text-lg">
                        {t('contact.subtitle', 'Questions about sizing, shipping, collaborations or press? We\'d love to hear from you.')}
                    </motion.p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
                    {/* ═══ LEFT: Contact Form (3 cols) ═══ */}
                    <motion.div
                        initial="hidden"
                        animate={isInView ? 'visible' : 'hidden'}
                        variants={stagger}
                        className="lg:col-span-3"
                    >
                        <AnimatePresence mode="wait">
                            {submitState === 'success' ? (
                                /* ─── Success State ─── */
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`p-8 sm:p-12 rounded-2xl border text-center ${
                                        isDark ? 'bg-gray-900 border-gray-800' : 'bg-warm-50 border-warm-400'
                                    }`}
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                        className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                                    >
                                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold mb-3">
                                        {t('contact.successTitle', 'Message Sent!')}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                                        {t('contact.successMessage', 'Thank you for reaching out. Our team will get back to you within 2 business hours.')}
                                    </p>
                                    {ticketId && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-mono">
                                            {t('contact.ticketRef', 'Reference')}: {ticketId}
                                        </p>
                                    )}
                                    <button
                                        onClick={handleNewMessage}
                                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
                                            isDark
                                                ? 'bg-warm-50 text-black hover:bg-warm-300'
                                                : 'bg-black text-white hover:bg-gray-900'
                                        }`}
                                    >
                                        <Send className="w-4 h-4" />
                                        {t('contact.sendAnother', 'Send Another Message')}
                                    </button>
                                </motion.div>
                            ) : (
                                /* ─── Form ─── */
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onSubmit={handleSubmit(onSubmit)}
                                    noValidate
                                    className={`p-6 sm:p-8 rounded-2xl border ${
                                        isDark ? 'bg-gray-900 border-gray-800' : 'bg-warm-50 border-warm-400'
                                    }`}
                                >
                                    {/* Error banner */}
                                    <AnimatePresence>
                                        {submitState === 'error' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-3"
                                                role="alert"
                                            >
                                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                                                        {t('contact.errorTitle', 'Failed to send message')}
                                                    </p>
                                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                        {t('contact.errorMessage', 'Please try again or contact us directly via WhatsApp or email.')}
                                                    </p>
                                                </div>
                                                <button type="button" onClick={() => setSubmitState('idle')} aria-label="Dismiss">
                                                    <X className="w-4 h-4 text-red-400" />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Honeypot (hidden from humans) */}
                                    <div className="absolute -left-[9999px]" aria-hidden="true">
                                        <input type="text" tabIndex={-1} autoComplete="off" {...register('honeypot')} />
                                    </div>

                                    {/* Row 1: Name + Email */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <motion.div variants={fadeUp}>
                                            <label htmlFor="contact-name" className="block text-sm font-medium mb-2">
                                                {t('contact.nameLabel', 'Full Name')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="contact-name"
                                                type="text"
                                                autoComplete="name"
                                                placeholder={t('contact.namePlaceholder', 'Your full name')}
                                                {...register('name')}
                                                className={`${inputBase} ${errors.name ? inputError : ''}`}
                                                aria-invalid={!!errors.name}
                                                aria-describedby={errors.name ? 'contact-name-err' : undefined}
                                            />
                                            {errors.name && (
                                                <p id="contact-name-err" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
                                                    <AlertCircle className="w-3 h-3" /> {errors.name.message}
                                                </p>
                                            )}
                                        </motion.div>
                                        <motion.div variants={fadeUp}>
                                            <label htmlFor="contact-email" className="block text-sm font-medium mb-2">
                                                {t('contact.emailLabel', 'Email')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="contact-email"
                                                type="email"
                                                autoComplete="email"
                                                placeholder={t('contact.emailPlaceholder', 'you@example.com')}
                                                {...register('email')}
                                                className={`${inputBase} ${errors.email ? inputError : ''}`}
                                                aria-invalid={!!errors.email}
                                                aria-describedby={errors.email ? 'contact-email-err' : undefined}
                                            />
                                            {errors.email && (
                                                <p id="contact-email-err" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
                                                    <AlertCircle className="w-3 h-3" /> {errors.email.message}
                                                </p>
                                            )}
                                        </motion.div>
                                    </div>

                                    {/* Row 2: Phone + Subject */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <motion.div variants={fadeUp}>
                                            <label htmlFor="contact-phone" className="block text-sm font-medium mb-2">
                                                {t('contact.phoneLabel', 'Phone')} <span className="text-gray-400 text-xs font-normal">({t('auth.optional', 'optional')})</span>
                                            </label>
                                            <input
                                                id="contact-phone"
                                                type="tel"
                                                autoComplete="tel"
                                                placeholder={t('contact.phonePlaceholder', '+34 600 000 000')}
                                                {...register('phone')}
                                                className={`${inputBase} ${errors.phone ? inputError : ''}`}
                                                aria-invalid={!!errors.phone}
                                                aria-describedby={errors.phone ? 'contact-phone-err' : undefined}
                                            />
                                            {errors.phone && (
                                                <p id="contact-phone-err" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
                                                    <AlertCircle className="w-3 h-3" /> {errors.phone.message}
                                                </p>
                                            )}
                                        </motion.div>
                                        <motion.div variants={fadeUp}>
                                            <label htmlFor="contact-subject" className="block text-sm font-medium mb-2">
                                                {t('contact.subjectLabel', 'Subject')} <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="contact-subject"
                                                    {...register('subject')}
                                                    className={`${inputBase} appearance-none pr-10 cursor-pointer ${errors.subject ? inputError : ''}`}
                                                    aria-invalid={!!errors.subject}
                                                    aria-describedby={errors.subject ? 'contact-subject-err' : undefined}
                                                >
                                                    <option value="">{t('contact.selectSubject', 'Select a topic…')}</option>
                                                    {SUBJECT_KEYS.map(key => (
                                                        <option key={key} value={key}>
                                                            {t(`contact.subjects.${key}`, key)}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                            {errors.subject && (
                                                <p id="contact-subject-err" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
                                                    <AlertCircle className="w-3 h-3" /> {errors.subject.message}
                                                </p>
                                            )}
                                        </motion.div>
                                    </div>

                                    {/* Row 3: Message */}
                                    <motion.div variants={fadeUp} className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <label htmlFor="contact-message" className="block text-sm font-medium">
                                                {t('contact.messageLabel', 'Message')} <span className="text-red-500">*</span>
                                            </label>
                                            <span className={`text-xs tabular-nums ${
                                                charCount > MAX_MESSAGE_LENGTH * 0.9
                                                    ? 'text-red-500 font-medium'
                                                    : 'text-gray-400'
                                            }`}>
                                                {charCount}/{MAX_MESSAGE_LENGTH}
                                            </span>
                                        </div>
                                        <textarea
                                            id="contact-message"
                                            rows={5}
                                            placeholder={t('contact.messagePlaceholder', 'Tell us how we can help…')}
                                            {...register('message')}
                                            className={`${inputBase} resize-none ${errors.message ? inputError : ''}`}
                                            aria-invalid={!!errors.message}
                                            aria-describedby={errors.message ? 'contact-message-err' : undefined}
                                        />
                                        {errors.message && (
                                            <p id="contact-message-err" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
                                                <AlertCircle className="w-3 h-3" /> {errors.message.message}
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* Row 4: Attachments */}
                                    <motion.div variants={fadeUp} className="mb-6">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <AnimatePresence mode="popLayout">
                                                {attachments.map((file, i) => (
                                                    <ImagePreview
                                                        key={file.name + i}
                                                        file={file}
                                                        index={i}
                                                        onRemove={() => removeAttachment(i)}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                            {attachments.length < MAX_ATTACHMENTS && (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
                                                        isDark
                                                            ? 'border-gray-700 hover:border-gray-600 text-gray-500 hover:text-gray-400'
                                                            : 'border-warm-500 hover:border-warm-500 text-gray-400 hover:text-gray-500'
                                                    }`}
                                                    aria-label={t('contact.attachImages', 'Attach images')}
                                                >
                                                    <ImagePlus className="w-5 h-5" />
                                                    <span className="text-[9px] font-medium">
                                                        {attachments.length}/{MAX_ATTACHMENTS}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept={ACCEPTED_IMAGE_TYPES.join(',')}
                                            multiple
                                            onChange={handleFileChange}
                                            className="hidden"
                                            aria-hidden="true"
                                        />
                                        <p className="mt-2 text-xs text-gray-400">
                                            {t('contact.attachHint', 'Attach up to 3 images (JPG, PNG, WebP, max 5MB each)')}
                                        </p>
                                    </motion.div>

                                    {/* Submit */}
                                    <motion.div variants={fadeUp}>
                                        <motion.button
                                            type="submit"
                                            disabled={isSubmitting || submitState === 'sending'}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                                                isDark
                                                    ? 'bg-warm-50 text-black hover:bg-warm-300'
                                                    : 'bg-black text-white hover:bg-gray-900'
                                            }`}
                                        >
                                            {submitState === 'sending' ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    {t('contact.sending', 'Sending…')}
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    {t('contact.submit', 'Send Message')}
                                                </>
                                            )}
                                        </motion.button>
                                        {/* reCAPTCHA v3 disclosure */}
                                        <p className="mt-3 text-[10px] text-gray-400 dark:text-gray-600 text-center flex items-center justify-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            {t('contact.recaptchaNotice', 'Protected by reCAPTCHA. Google')}{' '}
                                            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-400">
                                                {t('contact.privacy', 'Privacy')}
                                            </a>{' & '}
                                            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-400">
                                                {t('contact.terms', 'Terms')}
                                            </a>
                                        </p>
                                    </motion.div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* ═══ RIGHT: Sidebar (2 cols) ═══ */}
                    <motion.div
                        initial="hidden"
                        animate={isInView ? 'visible' : 'hidden'}
                        variants={stagger}
                        className="lg:col-span-2 space-y-4"
                    >
                        {/* Contact Methods */}
                        <motion.div variants={fadeUp}>
                            <ContactMethod
                                icon={FaWhatsapp}
                                label="WhatsApp"
                                value={t('contact.whatsappChat', 'Chat with us')}
                                href={whatsappUrl}
                                accent="bg-green-500"
                                isDark={isDark}
                            />
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <ContactMethod
                                icon={Phone}
                                label={t('contact.phoneLabel', 'Phone')}
                                value={CONTACT_PHONE}
                                href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
                                accent="bg-blue-500"
                                isDark={isDark}
                            />
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <ContactMethod
                                icon={Mail}
                                label={t('contact.emailLabel', 'Email')}
                                value={CONTACT_EMAIL}
                                href={`mailto:${CONTACT_EMAIL}`}
                                accent="bg-purple-500"
                                isDark={isDark}
                            />
                        </motion.div>

                        {/* Address & Hours */}
                        <motion.div
                            variants={fadeUp}
                            className={`p-5 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-warm-50 border-warm-400'}`}
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <MapPin className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
                                        {t('contact.physicalStore', 'Physical Store')}
                                    </p>
                                    <p className="text-sm font-medium">{CONTACT_ADDRESS}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 mb-4">
                                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
                                        {t('contact.businessHours', 'Business Hours')}
                                    </p>
                                    <p className="text-sm font-medium">{t('contact.hoursWeekday', 'Mon – Sat: 10:00 – 20:00')}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('contact.hoursSunday', 'Sunday: Closed')}</p>
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                                isDark ? 'bg-green-950/30 text-green-400' : 'bg-green-50 text-green-700'
                            }`}>
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                {t('contact.responseTime', 'Average response: under 2 hours')}
                            </div>
                        </motion.div>

                        {/* Map */}
                        <motion.div
                            ref={mapRef}
                            variants={fadeUp}
                            className={`rounded-xl overflow-hidden border ${isDark ? 'border-gray-800' : 'border-warm-400'}`}
                        >
                            {mapLoaded ? (
                                <iframe
                                    title={t('contact.mapTitle', 'Store location map')}
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3037.347!2d-3.703790!3d40.416775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd42287d0f0f1b4f%3A0x9a5d8ab1b4b1b4b!2sGran%20V%C3%ADa%2C%20Madrid%2C%20Spain!5e0!3m2!1sen!2sus!4v1699999999999"
                                    width="100%"
                                    height="220"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className={isDark ? 'grayscale invert contrast-90' : ''}
                                />
                            ) : (
                                <div className={`h-[220px] flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-warm-300'}`}>
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                </div>
                            )}
                        </motion.div>

                        {/* Social Links */}
                        <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 pt-2">
                            {[
                                { icon: FaInstagram, href: 'https://instagram.com/patrycloset', label: 'Instagram' },
                                { icon: FaFacebook, href: 'https://facebook.com/patrycloset', label: 'Facebook' },
                                { icon: FaTiktok, href: 'https://tiktok.com/@patrycloset', label: 'TikTok' },
                            ].map(social => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                        isDark
                                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                                            : 'bg-warm-300 hover:bg-warm-400 text-gray-500 hover:text-gray-900'
                                    }`}
                                >
                                    <social.icon className="w-4 h-4" />
                                </a>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;