import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { loginSchema } from '../../lib/validationSchemas';
import SocialButtons from './SocialButtons';

const LoginForm = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login, error: authError, clearError, isAuthenticated } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [socialError, setSocialError] = useState(null);

    const redirectTo = searchParams.get('redirect') || '/account';

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) navigate(decodeURIComponent(redirectTo), { replace: true });
    }, [isAuthenticated, navigate, redirectTo]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '', rememberMe: false },
    });

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setSocialError(null);
        clearError();
        try {
            await login(data);
            navigate(decodeURIComponent(redirectTo), { replace: true });
        } catch {
            // Error is set in AuthContext
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSocialSuccess = () => {
        navigate(decodeURIComponent(redirectTo), { replace: true });
    };

    const displayError = socialError || authError;

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <Link to="/" className="inline-flex items-center gap-2 mb-6">
                    <Sparkles className="w-6 h-6 text-pink-500" />
                    <span className="font-serif text-2xl tracking-wide">PATRY CLOSET</span>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                    {t('auth.welcomeBack', 'Welcome Back')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    {t('auth.loginSubtitle', 'Sign in to access your account, orders and wishlist')}
                </p>
            </motion.div>

            {/* Error Banner */}
            <AnimatePresence>
                {displayError && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-3"
                        role="alert"
                    >
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-300">{displayError}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Social Login */}
            <SocialButtons
                mode="login"
                onSuccess={handleSocialSuccess}
                onError={setSocialError}
            />

            {/* Login Form */}
            <motion.form
                onSubmit={handleSubmit(onSubmit)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-5"
                noValidate
            >
                {/* Email */}
                <div>
                    <label htmlFor="login-email" className="block text-sm font-medium mb-2">
                        {t('auth.email', 'Email Address')}
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            {...register('email')}
                            className={`w-full pl-11 pr-4 py-3.5 rounded-xl border-2 transition-colors bg-transparent focus:outline-none focus:ring-0 ${
                                errors.email
                                    ? 'border-red-400 focus:border-red-500'
                                    : 'border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white'
                            }`}
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? 'login-email-error' : undefined}
                        />
                    </div>
                    {errors.email && (
                        <p id="login-email-error" className="mt-1.5 text-sm text-red-500 flex items-center gap-1" role="alert">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.email.message}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="login-password" className="block text-sm font-medium">
                            {t('auth.password', 'Password')}
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-xs text-gray-500 hover:text-black dark:hover:text-white transition-colors underline-offset-2 hover:underline"
                        >
                            {t('auth.forgotPassword', 'Forgot password?')}
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            {...register('password')}
                            className={`w-full pl-11 pr-12 py-3.5 rounded-xl border-2 transition-colors bg-transparent focus:outline-none focus:ring-0 ${
                                errors.password
                                    ? 'border-red-400 focus:border-red-500'
                                    : 'border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white'
                            }`}
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? 'login-password-error' : undefined}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p id="login-password-error" className="mt-1.5 text-sm text-red-500 flex items-center gap-1" role="alert">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.password.message}
                        </p>
                    )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2">
                    <input
                        id="remember-me"
                        type="checkbox"
                        {...register('rememberMe')}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black dark:focus:ring-white accent-black dark:accent-white"
                    />
                    <label htmlFor="remember-me" className="text-sm text-gray-600 dark:text-gray-400">
                        {t('auth.rememberMe', 'Remember me for 30 days')}
                    </label>
                </div>

                {/* Submit */}
                <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-white dark:border-t-black rounded-full animate-spin" />
                    ) : (
                        <>
                            {t('auth.signIn', 'Sign In')}
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </motion.button>
            </motion.form>

            {/* Register Link */}
            <p className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
                {t('auth.noAccount', "Don't have an account?")}{' '}
                <Link
                    to="/register"
                    className="text-black dark:text-white font-semibold hover:underline underline-offset-2"
                >
                    {t('auth.createAccount', 'Create Account')}
                </Link>
            </p>

            {/* Demo Hint */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
            >
                <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                    <strong>Demo:</strong> demo@patrycloset.com / Demo1234!
                </p>
            </motion.div>
        </div>
    );
};

export default LoginForm;
