import { useState, useRef, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    User, Mail, Phone, Calendar, Camera, Save, AlertCircle, Check, Loader2,
} from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { profileSchema } from '../../lib/validationSchemas';

const ProfileTab = () => {
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const { user, updateProfile, uploadAvatar } = useAuth();
    const fileInputRef = useRef(null);

    const [isUploading, setIsUploading] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            phone: user?.phone || '',
            dateOfBirth: user?.dateOfBirth || '',
            gender: user?.gender || '',
        },
    });

    const GENDER_OPTIONS = [
        { value: 'female', label: t('auth.female', 'Female') },
        { value: 'male', label: t('auth.male', 'Male') },
        { value: 'non-binary', label: t('auth.nonBinary', 'Non-binary') },
        { value: 'prefer-not-to-say', label: t('auth.preferNotToSay', 'Prefer not to say') },
    ];

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try { await uploadAvatar(file); } catch { /* context handles */ }
        setIsUploading(false);
    };

    const onSubmit = async (data) => {
        setSaveStatus('saving');
        try {
            await updateProfile(data);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2000);
        } catch { setSaveStatus(null); }
    };

    const inputClass = (error) =>
        `w-full px-4 py-3 rounded-xl border-2 transition-colors bg-transparent focus:outline-none focus:ring-0 text-sm ${
            error ? 'border-red-400 focus:border-red-500' : 'border-warm-400 dark:border-gray-700 focus:border-black dark:focus:border-white'
        }`;

    return (
        <div className="max-w-2xl">
            <h2 className="text-xl font-bold mb-1">{t('account.profile', 'My Profile')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{t('account.profileDesc', 'Edit your personal information')}</p>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8">
                <div className="relative group">
                    <div className={`w-24 h-24 rounded-full overflow-hidden ring-4 ${isDark ? 'ring-gray-800 bg-gray-800' : 'ring-warm-300 bg-warm-300'}`}>
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user?.firstName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center"><User className="w-10 h-10 text-gray-400" /></div>
                        )}
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        aria-label={t('account.changePhoto', 'Change photo')}
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>
                <div>
                    <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs font-medium mt-1 hover:underline underline-offset-2">
                        {t('account.uploadPhoto', 'Upload new photo')}
                    </button>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="prof-first" className="block text-sm font-medium mb-1.5">{t('auth.firstName', 'First Name')}</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input id="prof-first" {...register('firstName')} className={`${inputClass(errors.firstName)} pl-10`} />
                        </div>
                        {errors.firstName && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.firstName.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="prof-last" className="block text-sm font-medium mb-1.5">{t('auth.lastName', 'Last Name')}</label>
                        <input id="prof-last" {...register('lastName')} className={inputClass(errors.lastName)} />
                        {errors.lastName && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.lastName.message}</p>}
                    </div>
                </div>

                <div>
                    <label htmlFor="prof-email" className="block text-sm font-medium mb-1.5">{t('auth.email', 'Email')}</label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input id="prof-email" type="email" {...register('email')} className={`${inputClass(errors.email)} pl-10`} />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email.message}</p>}
                </div>

                <div>
                    <label htmlFor="prof-phone" className="block text-sm font-medium mb-1.5">
                        {t('account.phone', 'Phone')} <span className="text-gray-400 text-xs">{t('auth.optional', '(optional)')}</span>
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input id="prof-phone" type="tel" {...register('phone')} placeholder="+34 612 345 678" className={`${inputClass(errors.phone)} pl-10`} />
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="prof-dob" className="block text-sm font-medium mb-1.5">
                            {t('auth.dateOfBirth', 'Date of Birth')} <span className="text-gray-400 text-xs">{t('auth.optional', '(optional)')}</span>
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input id="prof-dob" type="date" {...register('dateOfBirth')} className={`${inputClass(null)} pl-10`} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="prof-gender" className="block text-sm font-medium mb-1.5">
                            {t('auth.gender', 'Gender')} <span className="text-gray-400 text-xs">{t('auth.optional', '(optional)')}</span>
                        </label>
                        <select id="prof-gender" {...register('gender')} className={`${inputClass(null)} appearance-none`}>
                            <option value="">{t('auth.selectGender', 'Select...')}</option>
                            {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <motion.button
                        type="submit"
                        disabled={!isDirty || saveStatus === 'saving'}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {saveStatus === 'saving' ? <><Loader2 className="w-4 h-4 animate-spin" />{t('account.saving', 'Saving...')}</>
                         : saveStatus === 'saved' ? <><Check className="w-4 h-4" />{t('account.saved', 'Saved!')}</>
                         : <><Save className="w-4 h-4" />{t('account.saveChanges', 'Save Changes')}</>}
                    </motion.button>
                    <AnimatePresence>
                        {saveStatus === 'saved' && (
                            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-sm text-green-600 dark:text-green-400">
                                ✓ {t('account.changesSaved', 'Changes saved successfully')}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </form>
        </div>
    );
};

export default ProfileTab;
