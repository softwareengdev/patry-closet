import { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MapPin, Plus, Trash2, Edit3, Check, Star, AlertCircle, X, Loader2 } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { addressSchema } from '../../lib/validationSchemas';

const COUNTRIES = [
    { code: 'ES', name: 'Spain' }, { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' },
    { code: 'IT', name: 'Italy' }, { code: 'PT', name: 'Portugal' }, { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' }, { code: 'MX', name: 'Mexico' }, { code: 'AR', name: 'Argentina' },
];

const AddressCard = ({ address, isDefault, onEdit, onDelete, onSetDefault, isDark }) => {
    const { t } = useTranslation();
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative p-5 rounded-xl border-2 transition-all ${
                isDefault
                    ? isDark ? 'border-white/30 bg-gray-800/50' : 'border-black/20 bg-gray-50'
                    : isDark ? 'border-gray-800 hover:border-gray-700' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
            {isDefault && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black rounded-full">
                    <Star className="w-3 h-3" /> {t('account.default', 'Default')}
                </span>
            )}
            <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <MapPin className="w-5 h-5 text-green-500" />
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-sm">{address.label}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{address.firstName} {address.lastName}</p>
                </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {address.street}{address.apartment ? `, ${address.apartment}` : ''}<br />
                {address.city}, {address.state} {address.postalCode}<br />
                {COUNTRIES.find(c => c.code === address.country)?.name || address.country}
            </p>
            {address.phone && <p className="text-xs text-gray-400 mt-1">{address.phone}</p>}

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => onEdit(address)} className="text-xs font-medium hover:underline underline-offset-2 flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> {t('account.edit', 'Edit')}
                </button>
                {!isDefault && (
                    <button onClick={() => onSetDefault(address.id)} className="text-xs font-medium hover:underline underline-offset-2 flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <Star className="w-3 h-3" /> {t('account.setDefault', 'Set as default')}
                    </button>
                )}
                <button onClick={() => onDelete(address.id)} className="text-xs font-medium hover:underline underline-offset-2 flex items-center gap-1 text-red-500 ml-auto">
                    <Trash2 className="w-3 h-3" /> {t('account.delete', 'Delete')}
                </button>
            </div>
        </motion.div>
    );
};

const AddressesTab = () => {
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const { user, updateAddresses } = useAuth();

    const [addresses, setAddresses] = useState(user?.addresses || []);
    const [editingAddress, setEditingAddress] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
        resolver: zodResolver(addressSchema),
        defaultValues: { label: '', firstName: '', lastName: '', street: '', apartment: '', city: '', state: '', postalCode: '', country: 'ES', phone: '', isDefault: false },
    });

    const openAdd = () => {
        setEditingAddress(null);
        reset({ label: '', firstName: '', lastName: '', street: '', apartment: '', city: '', state: '', postalCode: '', country: 'ES', phone: '', isDefault: false });
        setShowForm(true);
    };

    const openEdit = (addr) => {
        setEditingAddress(addr);
        Object.entries(addr).forEach(([key, val]) => {
            if (key !== 'id' && key !== 'lat' && key !== 'lng') setValue(key, val);
        });
        setShowForm(true);
    };

    const onSubmit = async (data) => {
        setSaving(true);
        let updated;
        if (editingAddress) {
            updated = addresses.map(a => a.id === editingAddress.id ? { ...a, ...data } : a);
        } else {
            const newAddr = { ...data, id: 'addr_' + Math.random().toString(36).substr(2, 6) };
            updated = [...addresses, newAddr];
        }
        if (data.isDefault) {
            updated = updated.map(a => ({ ...a, isDefault: a.id === (editingAddress?.id || updated[updated.length - 1].id) }));
        }
        await updateAddresses(updated);
        setAddresses(updated);
        setShowForm(false);
        setEditingAddress(null);
        reset();
        setSaving(false);
    };

    const handleDelete = async (id) => {
        const updated = addresses.filter(a => a.id !== id);
        await updateAddresses(updated);
        setAddresses(updated);
    };

    const handleSetDefault = async (id) => {
        const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
        await updateAddresses(updated);
        setAddresses(updated);
    };

    const inputClass = (error) =>
        `w-full px-3 py-2.5 rounded-lg border-2 transition-colors bg-transparent focus:outline-none focus:ring-0 text-sm ${
            error ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white'
        }`;

    return (
        <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold mb-1">{t('account.addresses', 'My Addresses')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{addresses.length}/5 {t('account.addressesUsed', 'addresses saved')}</p>
                </div>
                {addresses.length < 5 && !showForm && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-medium">
                        <Plus className="w-4 h-4" /> {t('account.addAddress', 'Add Address')}
                    </motion.button>
                )}
            </div>

            {/* Address Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden"
                    >
                        <form onSubmit={handleSubmit(onSubmit)} noValidate
                            className={`p-5 rounded-xl border-2 ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">{editingAddress ? t('account.editAddress', 'Edit Address') : t('account.newAddress', 'New Address')}</h3>
                                <button type="button" onClick={() => { setShowForm(false); setEditingAddress(null); reset(); }}>
                                    <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t('account.addressLabel', 'Label')}</label>
                                    <input {...register('label')} placeholder="Home, Work..." className={inputClass(errors.label)} />
                                    {errors.label && <p className="mt-0.5 text-xs text-red-500">{errors.label.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t('account.phone', 'Phone')}</label>
                                    <input {...register('phone')} className={inputClass(null)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t('auth.firstName', 'First Name')}</label>
                                    <input {...register('firstName')} className={inputClass(errors.firstName)} />
                                    {errors.firstName && <p className="mt-0.5 text-xs text-red-500">{errors.firstName.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t('auth.lastName', 'Last Name')}</label>
                                    <input {...register('lastName')} className={inputClass(errors.lastName)} />
                                    {errors.lastName && <p className="mt-0.5 text-xs text-red-500">{errors.lastName.message}</p>}
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="block text-xs font-medium mb-1">{t('account.street', 'Street Address')}</label>
                                <input {...register('street')} className={inputClass(errors.street)} />
                                {errors.street && <p className="mt-0.5 text-xs text-red-500">{errors.street.message}</p>}
                            </div>
                            <div className="mb-3">
                                <label className="block text-xs font-medium mb-1">{t('account.apartment', 'Apartment, floor')} <span className="text-gray-400">{t('auth.optional', '(optional)')}</span></label>
                                <input {...register('apartment')} className={inputClass(null)} />
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t('account.city', 'City')}</label>
                                    <input {...register('city')} className={inputClass(errors.city)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t('account.state', 'State')}</label>
                                    <input {...register('state')} className={inputClass(errors.state)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t('account.postalCode', 'Postal Code')}</label>
                                    <input {...register('postalCode')} className={inputClass(errors.postalCode)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                    <label className="block text-xs font-medium mb-1">{t('account.country', 'Country')}</label>
                                    <select {...register('country')} className={`${inputClass(errors.country)} appearance-none`}>
                                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" {...register('isDefault')} className="w-4 h-4 rounded accent-black dark:accent-white" />
                                        {t('account.setAsDefault', 'Set as default shipping address')}
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.98 }}
                                    className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {t('account.saveAddress', 'Save Address')}
                                </motion.button>
                                <button type="button" onClick={() => { setShowForm(false); setEditingAddress(null); reset(); }}
                                    className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                                    {t('account.cancel', 'Cancel')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Address List */}
            <div className="grid gap-4 sm:grid-cols-2">
                <AnimatePresence>
                    {addresses.map(addr => (
                        <AddressCard key={addr.id} address={addr} isDefault={addr.isDefault} isDark={isDark}
                            onEdit={openEdit} onDelete={handleDelete} onSetDefault={handleSetDefault} />
                    ))}
                </AnimatePresence>
            </div>

            {addresses.length === 0 && !showForm && (
                <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{t('account.noAddresses', 'No addresses saved yet')}</p>
                    <button onClick={openAdd} className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-medium">
                        {t('account.addFirst', 'Add your first address')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AddressesTab;
