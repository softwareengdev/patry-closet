import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

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
 * Social login buttons — Google & Apple
 */
const SocialButtons = ({ mode = 'login', onSuccess, onError, className = '' }) => {
    const { t } = useTranslation();
    const { socialLogin } = useAuth();
    const [loadingProvider, setLoadingProvider] = useState(null);

    const handleSocialLogin = async (provider) => {
        setLoadingProvider(provider);
        try {
            const userData = await socialLogin(provider);
            onSuccess?.(userData);
        } catch (err) {
            onError?.(err?.response?.data?.message || `${provider} authentication failed`);
        } finally {
            setLoadingProvider(null);
        }
    };

    const actionText = mode === 'register' ? t('auth.signUpWith', 'Sign up with') : t('auth.continueWith', 'Continue with');

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            {/* Google */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSocialLogin('google')}
                disabled={!!loadingProvider}
                className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`${actionText} Google`}
            >
                {loadingProvider === 'google' ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                ) : (
                    <GoogleIcon />
                )}
                <span className="text-gray-700 dark:text-gray-200">{actionText} Google</span>
            </motion.button>

            {/* Apple */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSocialLogin('apple')}
                disabled={!!loadingProvider}
                className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`${actionText} Apple`}
            >
                {loadingProvider === 'apple' ? (
                    <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                ) : (
                    <span className="text-white dark:text-black"><AppleIcon /></span>
                )}
                <span className="text-white dark:text-black">{actionText} Apple</span>
            </motion.button>

            {/* Divider */}
            <div className="relative flex items-center my-2">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                <span className="px-4 text-xs text-gray-400 uppercase tracking-wider">
                    {t('auth.orContinueWithEmail', 'or continue with email')}
                </span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            </div>
        </div>
    );
};

export default SocialButtons;
