import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, AlertCircle, ArrowLeft, ArrowRight, Check, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { forgotPasswordSchema, resetPasswordSchema, getPasswordStrength } from '../../lib/validationSchemas';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const { forgotPassword, resetPassword } = useAuth();
    const resetToken = searchParams.get('token');
    const resetEmail = searchParams.get('email') || '';

    const [phase, setPhase] = useState(resetToken ? 'reset' : 'request');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    /* ─── Request reset form ─── */
    const requestForm = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    /* ─── Reset password form ─── */
    const resetForm = useForm({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const passwordValue = resetForm.watch('password');
    const strength = getPasswordStrength(passwordValue);

    const handleRequestReset = async (data) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await forgotPassword(data.email);
            setSuccess(true);
        } catch (err) {
            setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = async (data) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await resetPassword(resetToken, data.password, resetEmail);
            setPhase('done');
        } catch (err) {
            setError(err?.response?.data?.message || 'Invalid or expired reset link.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                <Link to="/" className="inline-block mb-6">
                    <span className="text-2xl lg:text-3xl font-bold tracking-tighter">PATRY<span className="text-rose">♡</span>CLOSET</span>
                </Link>
            </motion.div>

            <AnimatePresence mode="wait">
                {/* ═══ Phase: Request Reset Email ═══ */}
                {phase === 'request' && !success && (
                    <motion.div
                        key="request"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-warm-300 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                            </div>
                            <h1 className="text-2xl font-serif font-light tracking-tight mb-2">{t('auth.forgotPasswordTitle', 'Forgot your password?')}</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                {t('auth.forgotPasswordDesc', "No worries! Enter your email and we'll send you a reset link.")}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border-l-2 border-red-500 flex items-center gap-2" role="alert">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        <form onSubmit={requestForm.handleSubmit(handleRequestReset)} noValidate className="space-y-4">
                            <div>
                                <label htmlFor="forgot-email" className="block text-sm font-medium mb-2">
                                    {t('auth.email', 'Email Address')}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        {...requestForm.register('email')}
                                        className={`w-full pl-11 pr-4 py-3.5 border transition-colors bg-transparent focus:outline-none focus:ring-0 ${
                                            requestForm.formState.errors.email
                                                ? 'border-red-400 focus:border-red-500'
                                                : 'border-warm-300 dark:border-gray-800 focus:border-black dark:focus:border-white'
                                        }`}
                                    />
                                </div>
                                {requestForm.formState.errors.email && (
                                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1" role="alert">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {requestForm.formState.errors.email.message}
                                    </p>
                                )}
                            </div>

                            <motion.button
                                type="submit"
                                disabled={isSubmitting}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black font-medium text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-warm-500 border-t-white dark:border-t-black rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {t('auth.sendResetLink', 'Send Reset Link')}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <Link to="/login" className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            {t('auth.backToLogin', 'Back to Sign In')}
                        </Link>

                        <div className="text-center mt-4">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                {t('auth.backToStore', 'Back to Store')}
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* ═══ Phase: Email Sent Success ═══ */}
                {phase === 'request' && success && (
                    <motion.div
                        key="sent"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                            >
                                <Mail className="w-10 h-10 text-green-600 dark:text-green-400" />
                            </motion.div>
                        </div>
                        <h2 className="text-2xl font-serif font-light tracking-tight mb-2">{t('auth.checkYourEmail', 'Check Your Email')}</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                            {t('auth.resetEmailSent', "We've sent a password reset link to your email. The link expires in 15 minutes.")}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => { setSuccess(false); requestForm.reset(); }}
                                className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                            >
                                {t('auth.didntReceive', "Didn't receive the email? Try again")}
                            </button>
                            <Link
                                to="/login"
                                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-medium text-sm uppercase tracking-wider text-center"
                            >
                                {t('auth.backToLogin', 'Back to Sign In')}
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* ═══ Phase: Reset Password (with token) ═══ */}
                {phase === 'reset' && (
                    <motion.div
                        key="reset"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-warm-300 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                            </div>
                            <h1 className="text-2xl font-serif font-light tracking-tight mb-2">{t('auth.setNewPassword', 'Set New Password')}</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                {t('auth.setNewPasswordDesc', 'Your new password must be different from previously used passwords.')}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border-l-2 border-red-500 flex items-center gap-2" role="alert">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        <form onSubmit={resetForm.handleSubmit(handleResetPassword)} noValidate className="space-y-4">
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium mb-2">{t('auth.newPassword', 'New Password')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    <input
                                        id="new-password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        {...resetForm.register('password')}
                                        className={`w-full pl-11 pr-12 py-3.5 border transition-colors bg-transparent focus:outline-none focus:ring-0 ${
                                            resetForm.formState.errors.password ? 'border-red-400' : 'border-warm-300 dark:border-gray-800 focus:border-black dark:focus:border-white'
                                        }`}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {passwordValue && (
                                    <div className="mt-2 flex gap-1">
                                        {[1, 2, 3, 4, 5].map((l) => (
                                            <div key={l} className={`h-1 flex-1 rounded-full ${l <= strength.score ? strength.color : 'bg-warm-400 dark:bg-gray-700'}`} />
                                        ))}
                                    </div>
                                )}
                                {resetForm.formState.errors.password && (
                                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1" role="alert">
                                        <AlertCircle className="w-3.5 h-3.5" />{resetForm.formState.errors.password.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirm-new-password" className="block text-sm font-medium mb-2">{t('auth.confirmNewPassword', 'Confirm New Password')}</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    <input
                                        id="confirm-new-password"
                                        type={showConfirm ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        {...resetForm.register('confirmPassword')}
                                        className={`w-full pl-11 pr-12 py-3.5 border transition-colors bg-transparent focus:outline-none focus:ring-0 ${
                                            resetForm.formState.errors.confirmPassword ? 'border-red-400' : 'border-warm-300 dark:border-gray-800 focus:border-black dark:focus:border-white'
                                        }`}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {resetForm.formState.errors.confirmPassword && (
                                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1" role="alert">
                                        <AlertCircle className="w-3.5 h-3.5" />{resetForm.formState.errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>

                            <motion.button
                                type="submit"
                                disabled={isSubmitting}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black font-medium text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-warm-500 border-t-white dark:border-t-black rounded-full animate-spin" />
                                ) : (
                                    t('auth.resetPassword', 'Reset Password')
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                )}

                {/* ═══ Phase: Done ═══ */}
                {phase === 'done' && (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                            </motion.div>
                        </div>
                        <h2 className="text-2xl font-serif font-light tracking-tight mb-2">{t('auth.passwordReset', 'Password Reset!')}</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            {t('auth.passwordResetSuccess', 'Your password has been updated successfully. You can now sign in.')}
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-medium text-sm uppercase tracking-wider"
                        >
                            {t('auth.signIn', 'Sign In')}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ForgotPassword;
