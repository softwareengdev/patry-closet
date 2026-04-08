import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';

const isDevMode = import.meta.env.DEV;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const useRealGoogleOAuth = !!GOOGLE_CLIENT_ID;

/* ─── SVG icons for social providers ─── */
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const AppleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.12 4.53-3.74 4.25z"/>
    </svg>
);

/**
 * Dev-mode dialog — collects email + name instead of real OAuth redirect.
 */
const DevModeDialog = ({ provider, onSubmit, onClose }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setError(t('auth.emailRequired', 'Email is required'));
            return;
        }
        onSubmit({ email: email.trim(), name: name.trim() });
    };

    const providerLabel = provider === 'google' ? 'Google' : 'Apple';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 border border-warm-300 dark:border-gray-700 p-6 w-full max-w-sm mx-4 shadow-xl"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Dev Mode — {providerLabel}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-4 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                    OAuth credentials not configured. Enter user info to simulate {providerLabel} login.
                </div>

                {error && (
                    <div className="mb-3 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label htmlFor="dev-email" className="block text-sm font-medium mb-1">
                            {t('auth.email', 'Email Address')} *
                        </label>
                        <input
                            id="dev-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoFocus
                            className="w-full px-3 py-2.5 border border-warm-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="dev-name" className="block text-sm font-medium mb-1">
                            {t('auth.fullName', 'Full Name')}
                        </label>
                        <input
                            id="dev-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jane Doe"
                            className="w-full px-3 py-2.5 border border-warm-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:border-black dark:focus:border-white"
                        />
                    </div>
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black font-medium text-sm uppercase tracking-wider hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors"
                    >
                        {t('auth.continueAs', 'Continue as')} {providerLabel} {t('auth.user', 'User')}
                    </motion.button>
                </form>
            </motion.div>
        </motion.div>
    );
};

/**
 * Social login buttons — Google (real OAuth or dev-mode) & Apple (dev-mode only)
 */
const SocialButtons = ({ mode = 'login', onSuccess, onError, className = '' }) => {
    const { t } = useTranslation();
    const { socialLogin } = useAuth();
    const [loadingProvider, setLoadingProvider] = useState(null);
    const [devDialogProvider, setDevDialogProvider] = useState(null);

    // Dev-mode Google uses simulated credentials; real Google is handled separately
    const googleUsesDevMode = isDevMode && !useRealGoogleOAuth;

    const executeSocialLogin = async (provider, token, email, name) => {
        setLoadingProvider(provider);
        try {
            const params = { provider };
            if (token) {
                params.token = token;
            }
            if (email) {
                params.email = email;
                params.name = name;
            }
            const userData = await socialLogin(params);
            onSuccess?.(userData);
        } catch (err) {
            onError?.(err?.response?.data?.message || `${provider} authentication failed`);
        } finally {
            setLoadingProvider(null);
        }
    };

    /* ── Google OAuth credential callback (returns id_token) ── */
    const handleGoogleSuccess = async (credentialResponse) => {
        if (credentialResponse?.credential) {
            await executeSocialLogin('google', credentialResponse.credential);
        }
    };

    const handleGoogleError = () => {
        onError?.('Google login failed. Please try again.');
    };

    /* ── Apple: dev-mode only (no Apple Developer account configured) ── */
    const handleAppleLogin = () => {
        if (isDevMode) {
            setDevDialogProvider('apple');
            return;
        }
        onError?.('Apple Sign-In is not yet configured');
    };

    /* ── Dev-mode dialog submit (Google fallback & Apple) ── */
    const handleDevSubmit = async ({ email, name }) => {
        const provider = devDialogProvider;
        setDevDialogProvider(null);
        const token = btoa(JSON.stringify({ email, name }));
        await executeSocialLogin(provider, token, email, name);
    };

    const actionText = mode === 'register' ? t('auth.signUpWith', 'Sign up with') : t('auth.continueWith', 'Continue with');

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            {/* Dev Mode badge — only when all social logins are simulated */}
            {googleUsesDevMode && (
                <div className="text-center text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-semibold">
                    ⚠ Dev Mode — Social login uses simulated credentials
                </div>
            )}

            {/* Google — real OAuth via GoogleLogin component */}
            {useRealGoogleOAuth ? (
                <div className="w-full [&_iframe]:!w-full">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="outline"
                        shape="rectangular"
                        size="large"
                        width={400}
                        text={mode === 'register' ? 'signup_with' : 'continue_with'}
                        locale="es"
                        useOneTap={false}
                    />
                </div>
            ) : (
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                        if (isDevMode) {
                            setDevDialogProvider('google');
                        }
                    }}
                    disabled={!!loadingProvider}
                    className="flex items-center justify-center gap-3 w-full py-3 px-4 border border-warm-300 dark:border-gray-800 bg-warm-50 dark:bg-gray-800 hover:bg-warm-200 dark:hover:bg-gray-750 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`${actionText} Google`}
                >
                    {loadingProvider === 'google' ? (
                        <div className="w-5 h-5 border-2 border-warm-500 border-t-blue-500 rounded-full animate-spin" />
                    ) : (
                        <GoogleIcon />
                    )}
                    <span className="text-gray-700 dark:text-gray-200">{actionText} Google</span>
                </motion.button>
            )}

            {/* Apple — dev-mode dialog only (no Apple Developer account) */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleAppleLogin}
                disabled={!!loadingProvider}
                className="flex items-center justify-center gap-3 w-full py-3 px-4 border border-warm-300 dark:border-gray-800 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`${actionText} Apple`}
            >
                {loadingProvider === 'apple' ? (
                    <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                ) : (
                    <span className="text-white dark:text-black"><AppleIcon /></span>
                )}
                <span className="text-white dark:text-black">{actionText} Apple</span>
            </motion.button>

            {/* Dev Mode Dialog (Google fallback when no client ID + Apple always) */}
            <AnimatePresence>
                {devDialogProvider && (
                    <DevModeDialog
                        provider={devDialogProvider}
                        onSubmit={handleDevSubmit}
                        onClose={() => setDevDialogProvider(null)}
                    />
                )}
            </AnimatePresence>

            {/* Divider */}
            <div className="relative flex items-center my-2">
                <div className="flex-1 h-px bg-warm-300 dark:bg-gray-800" />
                <span className="px-4 text-xs text-gray-400 uppercase tracking-wider">
                    {t('auth.orContinueWithEmail', 'or continue with email')}
                </span>
                <div className="flex-1 h-px bg-warm-300 dark:bg-gray-800" />
            </div>
        </div>
    );
};

export default SocialButtons;
