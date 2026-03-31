import { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Shield, Lock, Smartphone, Monitor, Globe, Trash2, Eye, EyeOff,
    AlertCircle, Check, Loader2, Key, LogOut,
} from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { resetPasswordSchema, getPasswordStrength } from '../../lib/validationSchemas';
import authService from '../../lib/authService';

const SecurityTab = () => {
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const { user, logoutAllDevices } = useAuth();

    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFactorEnabled || false);

    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    const passwordValue = watch('password');
    const strength = getPasswordStrength(passwordValue);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await authService.getSessions();
                setSessions(data);
            } catch { /* ignore */ }
            setLoadingSessions(false);
        };
        load();
    }, []);

    const handleChangePassword = async (data) => {
        setChangingPassword(true);
        try {
            await authService.resetPassword('mock-token', data.password);
            setPasswordChanged(true);
            setShowPasswordForm(false);
            reset();
            setTimeout(() => setPasswordChanged(false), 3000);
        } catch { /* ignore */ }
        setChangingPassword(false);
    };

    const handleRevokeSession = async (id) => {
        await authService.revokeSession(id);
        setSessions(prev => prev.filter(s => s.id !== id));
    };

    const handleLogoutAll = async () => {
        await logoutAllDevices();
    };

    const getDeviceIcon = (device) => {
        if (device.includes('iPhone') || device.includes('Android') || device.includes('Mobile')) return Smartphone;
        if (device.includes('Chrome') || device.includes('Firefox') || device.includes('Safari')) return Monitor;
        return Globe;
    };

    return (
        <div className="max-w-2xl">
            <h2 className="text-xl font-bold mb-1">{t('account.security', 'Security & Sessions')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{t('account.securityDesc', 'Manage your password, 2FA, and active sessions')}</p>

            {/* ─── Change Password ─── */}
            <div className={`p-5 rounded-xl border mb-6 ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <Lock className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">{t('account.changePassword', 'Change Password')}</h3>
                            <p className="text-xs text-gray-500">{t('account.lastChanged', 'Last changed: Never')}</p>
                        </div>
                    </div>
                    {!showPasswordForm && (
                        <button onClick={() => setShowPasswordForm(true)}
                            className="text-sm font-medium hover:underline underline-offset-2">
                            {t('account.change', 'Change')}
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {passwordChanged && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                            <Check className="w-4 h-4" /> {t('account.passwordUpdated', 'Password updated successfully!')}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showPasswordForm && (
                        <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleSubmit(handleChangePassword)}
                            noValidate
                            className="mt-4 space-y-3 overflow-hidden"
                        >
                            <div>
                                <label className="block text-xs font-medium mb-1">{t('auth.newPassword', 'New Password')}</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} {...register('password')} autoComplete="new-password"
                                        className={`w-full px-3 pr-10 py-2.5 rounded-lg border-2 bg-transparent focus:outline-none text-sm ${
                                            errors.password ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white'
                                        }`} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {passwordValue && (
                                    <div className="mt-1.5 flex gap-1">
                                        {[1, 2, 3, 4, 5].map(l => (
                                            <div key={l} className={`h-1 flex-1 rounded-full ${l <= strength.score ? strength.color : 'bg-gray-200 dark:bg-gray-700'}`} />
                                        ))}
                                    </div>
                                )}
                                {errors.password && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">{t('auth.confirmNewPassword', 'Confirm New Password')}</label>
                                <div className="relative">
                                    <input type={showConfirm ? 'text' : 'password'} {...register('confirmPassword')} autoComplete="new-password"
                                        className={`w-full px-3 pr-10 py-2.5 rounded-lg border-2 bg-transparent focus:outline-none text-sm ${
                                            errors.confirmPassword ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white'
                                        }`} />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword.message}</p>}
                            </div>

                            <div className="flex gap-2 pt-1">
                                <motion.button type="submit" disabled={changingPassword} whileTap={{ scale: 0.98 }}
                                    className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                                    {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {t('account.updatePassword', 'Update Password')}
                                </motion.button>
                                <button type="button" onClick={() => { setShowPasswordForm(false); reset(); }}
                                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                                    {t('account.cancel', 'Cancel')}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── Two-Factor Authentication ─── */}
            <div className={`p-5 rounded-xl border mb-6 ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <Key className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">{t('account.twoFactor', 'Two-Factor Authentication')}</h3>
                            <p className="text-xs text-gray-500">
                                {twoFAEnabled
                                    ? t('account.twoFAEnabled', 'Enabled — using authenticator app')
                                    : t('account.twoFADisabled', 'Add an extra layer of security')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setTwoFAEnabled(!twoFAEnabled)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${twoFAEnabled ? 'bg-green-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'}`}
                        role="switch"
                        aria-checked={twoFAEnabled}
                        aria-label="Toggle two-factor authentication"
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform bg-white ${twoFAEnabled ? 'translate-x-5' : ''}`} />
                    </button>
                </div>
                {twoFAEnabled && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-gray-500 dark:text-gray-400 pl-13">
                        {t('account.twoFANote', 'Use Google Authenticator or Authy to scan the QR code during setup. This feature will be fully functional with the backend.')}
                    </motion.p>
                )}
            </div>

            {/* ─── Active Sessions ─── */}
            <div className={`p-5 rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <Shield className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">{t('account.activeSessions', 'Active Sessions')}</h3>
                            <p className="text-xs text-gray-500">{sessions.length} {t('account.devicesConnected', 'devices connected')}</p>
                        </div>
                    </div>
                    <button onClick={handleLogoutAll}
                        className="text-xs font-medium text-red-500 hover:underline underline-offset-2 flex items-center gap-1">
                        <LogOut className="w-3 h-3" /> {t('account.logoutAll', 'Sign out all')}
                    </button>
                </div>

                {loadingSessions ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className={`h-14 rounded-lg animate-pulse ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />)}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {sessions.map(session => {
                                const DeviceIcon = getDeviceIcon(session.device);
                                return (
                                    <motion.div
                                        key={session.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${
                                            session.isCurrent
                                                ? isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
                                                : isDark ? 'bg-gray-800/50' : 'bg-white border border-gray-100'
                                        }`}
                                    >
                                        <DeviceIcon className={`w-5 h-5 shrink-0 ${session.isCurrent ? 'text-green-500' : 'text-gray-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{session.device}</span>
                                                {session.isCurrent && (
                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-green-500 text-white rounded-full">
                                                        {t('account.currentSession', 'Current')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">{session.location} · {session.ip}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] text-gray-400">
                                                {session.isCurrent ? t('account.activeNow', 'Active now') : new Date(session.lastActive).toLocaleDateString()}
                                            </p>
                                            {!session.isCurrent && (
                                                <button onClick={() => handleRevokeSession(session.id)}
                                                    className="text-[10px] text-red-500 hover:underline mt-0.5">
                                                    {t('account.revoke', 'Revoke')}
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecurityTab;
