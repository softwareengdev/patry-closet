import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Eye, EyeOff, Mail, Lock, User, Calendar, AlertCircle, ArrowRight,
    Check, ShieldCheck, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { registerSchema, getPasswordStrength } from '../../lib/validationSchemas';
import SocialButtons from './SocialButtons';

const RegisterForm = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { register: registerUser, error: authError, clearError } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [socialError, setSocialError] = useState(null);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [step, setStep] = useState(1); // 1: social + basics, 2: password + extras

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        trigger,
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
            dateOfBirth: '', gender: undefined, acceptTerms: false,
        },
    });

    const passwordValue = watch('password');
    const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setSocialError(null);
        clearError();
        try {
            await registerUser({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                dateOfBirth: data.dateOfBirth || undefined,
                gender: data.gender || undefined,
            });
            navigate('/account/verify-email', { state: { email: data.email, justRegistered: true } });
        } catch {
            // Error set by AuthContext
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNextStep = async () => {
        const valid = await trigger(['firstName', 'lastName', 'email']);
        if (valid) setStep(2);
    };

    const handleSocialSuccess = () => {
        navigate('/account', { replace: true });
    };

    const displayError = socialError || authError;

    const GENDER_OPTIONS = [
        { value: 'female', label: t('auth.female', 'Female') },
        { value: 'male', label: t('auth.male', 'Male') },
        { value: 'non-binary', label: t('auth.nonBinary', 'Non-binary') },
        { value: 'prefer-not-to-say', label: t('auth.preferNotToSay', 'Prefer not to say') },
    ];

    /* ─── Reusable Input Component ─── */
    const FormInput = ({ id, label, icon: Icon, type = 'text', autoComplete, placeholder, name, error, children }) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium mb-2">{label}</label>
            <div className="relative">
                {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />}
                <input
                    id={id}
                    type={type}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    {...register(name)}
                    className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 border transition-colors bg-transparent focus:outline-none focus:ring-0 ${
                        error
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-warm-300 dark:border-gray-800 focus:border-black dark:focus:border-white'
                    }`}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                />
                {children}
            </div>
            {error && (
                <p id={`${id}-error`} className="mt-1.5 text-sm text-red-500 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error.message}
                </p>
            )}
        </div>
    );

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                <Link to="/" className="inline-block mb-6">
                    <span className="text-2xl lg:text-3xl font-bold tracking-tighter">PATRY<span className="text-rose">♡</span>CLOSET</span>
                </Link>
                <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-tight mb-2">
                    {t('auth.createAccountTitle', 'Create Your Account')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                    {t('auth.registerSubtitle', 'Join the Patry Closet community')}
                </p>
            </motion.div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
                {[1, 2].map((s) => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                        <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors ${
                            step >= s ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-warm-400 dark:bg-gray-700 text-gray-500'
                        }`}>
                            {step > s ? <Check className="w-4 h-4" /> : s}
                        </div>
                        {s < 2 && <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-black dark:bg-white' : 'bg-warm-400 dark:bg-gray-700'}`} />}
                    </div>
                ))}
            </div>

            {/* Error */}
            <AnimatePresence>
                {displayError && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border-l-2 border-red-500 flex items-start gap-3"
                        role="alert"
                    >
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-300">{displayError}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Social (only on step 1) */}
            {step === 1 && (
                <SocialButtons mode="register" onSuccess={handleSocialSuccess} onError={setSocialError} />
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput
                                    id="reg-first-name" label={t('auth.firstName', 'First Name')}
                                    icon={User} autoComplete="given-name" placeholder="Patricia"
                                    name="firstName" error={errors.firstName}
                                />
                                <FormInput
                                    id="reg-last-name" label={t('auth.lastName', 'Last Name')}
                                    autoComplete="family-name" placeholder="García"
                                    name="lastName" error={errors.lastName}
                                />
                            </div>

                            <FormInput
                                id="reg-email" label={t('auth.email', 'Email Address')}
                                icon={Mail} type="email" autoComplete="email" placeholder="you@example.com"
                                name="email" error={errors.email}
                            />

                            <motion.button
                                type="button"
                                onClick={handleNextStep}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black font-medium text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-900 dark:hover:bg-gray-800 transition-colors mt-2"
                            >
                                {t('auth.continue', 'Continue')}
                                <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {/* Password */}
                            <div>
                                <label htmlFor="reg-password" className="block text-sm font-medium mb-2">
                                    {t('auth.password', 'Password')}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    <input
                                        id="reg-password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        {...register('password')}
                                        className={`w-full pl-11 pr-12 py-3.5 border transition-colors bg-transparent focus:outline-none focus:ring-0 ${
                                            errors.password
                                                ? 'border-red-400 focus:border-red-500'
                                                : 'border-warm-300 dark:border-gray-800 focus:border-black dark:focus:border-white'
                                        }`}
                                        aria-invalid={!!errors.password}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {/* Strength meter */}
                                {passwordValue && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4, 5].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-1 flex-1 rounded-full transition-colors ${
                                                        level <= strength.score ? strength.color : 'bg-warm-400 dark:bg-gray-700'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500">{strength.label}</p>
                                    </div>
                                )}
                                {errors.password && (
                                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1" role="alert">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="reg-confirm" className="block text-sm font-medium mb-2">
                                    {t('auth.confirmPassword', 'Confirm Password')}
                                </label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    <input
                                        id="reg-confirm"
                                        type={showConfirm ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        {...register('confirmPassword')}
                                        className={`w-full pl-11 pr-12 py-3.5 border transition-colors bg-transparent focus:outline-none focus:ring-0 ${
                                            errors.confirmPassword
                                                ? 'border-red-400 focus:border-red-500'
                                                : 'border-warm-300 dark:border-gray-800 focus:border-black dark:focus:border-white'
                                        }`}
                                        aria-invalid={!!errors.confirmPassword}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1" role="alert">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>

                            {/* Optional: Date of Birth + Gender */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="reg-dob" className="block text-sm font-medium mb-2">
                                        {t('auth.dateOfBirth', 'Date of Birth')}
                                        <span className="text-gray-400 ml-1 text-xs">{t('auth.optional', '(optional)')}</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        <input
                                            id="reg-dob"
                                            type="date"
                                            {...register('dateOfBirth')}
                                            className="w-full pl-11 pr-4 py-3.5 border border-warm-300 dark:border-gray-800 focus:border-black dark:focus:border-white transition-colors bg-transparent focus:outline-none focus:ring-0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="reg-gender" className="block text-sm font-medium mb-2">
                                        {t('auth.gender', 'Gender')}
                                        <span className="text-gray-400 ml-1 text-xs">{t('auth.optional', '(optional)')}</span>
                                    </label>
                                    <select
                                        id="reg-gender"
                                        {...register('gender')}
                                        className="w-full px-4 py-3.5 border border-warm-300 dark:border-gray-800 focus:border-black dark:focus:border-white transition-colors bg-transparent focus:outline-none focus:ring-0 appearance-none"
                                    >
                                        <option value="">{t('auth.selectGender', 'Select...')}</option>
                                        {GENDER_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="flex items-start gap-3 mt-2">
                                <input
                                    id="accept-terms"
                                    type="checkbox"
                                    {...register('acceptTerms')}
                                    className="mt-1 w-4 h-4 border-warm-500 dark:border-gray-600 accent-black dark:accent-white"
                                />
                                <label htmlFor="accept-terms" className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {t('auth.acceptTermsPrefix', 'I agree to the')}{' '}
                                    <button type="button" onClick={() => setShowTermsModal(true)} className="text-black dark:text-white underline underline-offset-2 font-medium">
                                        {t('auth.termsOfService', 'Terms of Service')}
                                    </button>{' '}
                                    {t('auth.and', 'and')}{' '}
                                    <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-black dark:text-white underline underline-offset-2 font-medium">
                                        {t('auth.privacyPolicy', 'Privacy Policy')}
                                    </button>
                                </label>
                            </div>
                            {errors.acceptTerms && (
                                <p className="text-sm text-red-500 flex items-center gap-1 -mt-2" role="alert">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {errors.acceptTerms.message}
                                </p>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3.5 border border-warm-300 dark:border-gray-800 text-sm font-medium hover:bg-warm-200 dark:hover:bg-gray-800 transition-colors"
                                >
                                    {t('auth.back', 'Back')}
                                </button>
                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="flex-1 py-3.5 bg-black dark:bg-white text-white dark:text-black font-medium text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-900 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-warm-500 border-t-white dark:border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {t('auth.createAccount', 'Create Account')}
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

            {/* Login Link */}
            <p className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
                {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
                <Link to="/login" className="text-black dark:text-white font-semibold hover:underline underline-offset-2">
                    {t('auth.signIn', 'Sign In')}
                </Link>
            </p>

            {/* Back to Store */}
            <div className="text-center mt-6">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {t('auth.backToStore', 'Back to Store')}
                </Link>
            </div>

            {/* Terms Modal */}
            <AnimatePresence>
                {(showTermsModal || showPrivacyModal) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => { setShowTermsModal(false); setShowPrivacyModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-warm-50 dark:bg-gray-900 max-w-lg w-full max-h-[70vh] overflow-y-auto p-6 shadow-2xl"
                        >
                            <h2 className="text-xl font-bold mb-4">
                                {showTermsModal ? t('auth.termsOfService', 'Terms of Service') : t('auth.privacyPolicy', 'Privacy Policy')}
                            </h2>
                            <div className="prose dark:prose-invert text-sm">
                                {showTermsModal ? (
                                    <div>
                                        <p>Last updated: March 2026</p>
                                        <p>Welcome to Patry Closet. By using our service, you agree to be bound by these terms. Please read them carefully.</p>
                                        <h3>1. Use of Service</h3>
                                        <p>You must be at least 16 years old to use this service. You are responsible for maintaining the confidentiality of your account.</p>
                                        <h3>2. Purchases</h3>
                                        <p>All prices are in EUR and include applicable taxes. We reserve the right to refuse or cancel orders.</p>
                                        <h3>3. Returns</h3>
                                        <p>You have 30 days to return unworn items with original tags. See our Returns Policy for details.</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p>Last updated: March 2026</p>
                                        <p>At Patry Closet, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.</p>
                                        <h3>1. Data Collection</h3>
                                        <p>We collect information you provide directly (name, email, shipping address) and automatically (browsing behavior, device information).</p>
                                        <h3>2. Data Use</h3>
                                        <p>Your data is used to process orders, personalize recommendations, and improve our services.</p>
                                        <h3>3. Your Rights</h3>
                                        <p>Under GDPR, you have the right to access, rectify, or delete your personal data at any time.</p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => { setShowTermsModal(false); setShowPrivacyModal(false); }}
                                className="mt-6 w-full py-3 bg-black dark:bg-white text-white dark:text-black font-medium text-sm uppercase tracking-wider"
                            >
                                {t('close', 'Close')}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RegisterForm;
