import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Mail, Check, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const VerifyEmail = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { verifyEmail, resendVerification, user } = useAuth();

    const token = searchParams.get('token');
    const email = location.state?.email || user?.email || '';
    const justRegistered = location.state?.justRegistered || false;

    const [status, setStatus] = useState(token ? 'verifying' : 'waiting');
    const [error, setError] = useState(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Auto-verify if token present
    useEffect(() => {
        if (!token) return;
        const verify = async () => {
            try {
                await verifyEmail(token);
                setStatus('success');
            } catch (err) {
                setError(err?.response?.data?.message || 'Verification failed. The link may have expired.');
                setStatus('error');
            }
        };
        verify();
    }, [token, verifyEmail]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleResend = async () => {
        try {
            await resendVerification(email);
            setResendCooldown(60);
        } catch {
            setError('Could not send verification email. Please try again later.');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto text-center">
            {/* Header */}
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
                <span className="text-2xl lg:text-3xl font-bold tracking-tighter">PATRY<span className="text-rose">♡</span>CLOSET</span>
            </Link>

            {/* ═══ Verifying ═══ */}
            {status === 'verifying' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="w-20 h-20 bg-warm-300 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
                        <div className="w-10 h-10 border-4 border-warm-400 dark:border-gray-700 border-t-black dark:border-t-white rounded-full animate-spin" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-light tracking-tight mb-2">{t('auth.verifyingEmail', 'Verifying Your Email...')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {t('auth.pleaseWait', 'Please wait a moment')}
                    </p>
                </motion.div>
            )}

            {/* ═══ Waiting (just registered, no token) ═══ */}
            {status === 'waiting' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-light tracking-tight mb-2">
                        {justRegistered
                            ? t('auth.verifyYourEmail', 'Verify Your Email')
                            : t('auth.emailVerification', 'Email Verification')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 leading-relaxed">
                        {justRegistered
                            ? t('auth.verificationSent', "We've sent a verification link to:")
                            : t('auth.verificationNeeded', 'Please verify your email address:')}
                    </p>
                    {email && (
                        <p className="font-semibold text-lg mb-6">{email}</p>
                    )}

                    <div className="bg-warm-200 dark:bg-gray-800/50 p-4 mb-6 text-left">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {t('auth.checkInbox', "Check your inbox and click the verification link. If you don't see it, check your spam folder.")}
                        </p>
                    </div>

                    <button
                        onClick={handleResend}
                        disabled={resendCooldown > 0}
                        className="inline-flex items-center gap-2 text-sm font-medium text-black dark:text-white hover:underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                        {resendCooldown > 0
                            ? `${t('auth.resendIn', 'Resend in')} ${resendCooldown}s`
                            : t('auth.resendEmail', 'Resend verification email')}
                    </button>

                    <div className="mt-8">
                        <Link
                            to="/account"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium text-sm uppercase tracking-wider"
                        >
                            {t('auth.continueToAccount', 'Continue to Account')}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* ═══ Success ═══ */}
            {status === 'success' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </motion.div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-light tracking-tight mb-2">{t('auth.emailVerified', 'Email Verified!')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        {t('auth.emailVerifiedDesc', 'Your email has been verified successfully. You now have full access to your account.')}
                    </p>
                    <Link
                        to="/account"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-medium text-sm uppercase tracking-wider"
                    >
                        {t('auth.goToAccount', 'Go to My Account')}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            )}

            {/* ═══ Error ═══ */}
            {status === 'error' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-light tracking-tight mb-2">{t('auth.verificationFailed', 'Verification Failed')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{error}</p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleResend}
                            disabled={resendCooldown > 0}
                            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-medium text-sm uppercase tracking-wider disabled:opacity-50"
                        >
                            {resendCooldown > 0
                                ? `${t('auth.resendIn', 'Resend in')} ${resendCooldown}s`
                                : t('auth.resendVerification', 'Resend Verification Email')}
                        </button>
                        <Link
                            to="/login"
                            className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                        >
                            {t('auth.backToLogin', 'Back to Sign In')}
                        </Link>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default VerifyEmail;
