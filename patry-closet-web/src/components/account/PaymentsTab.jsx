import { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Plus, Trash2, Star, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import authService from '../../lib/authService';
import api from '../../lib/api';

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
const stripePromise = loadStripe(STRIPE_PK);

const BRAND_ICONS = {
    visa: (
        <svg viewBox="0 0 48 32" className="w-10 h-7"><rect width="48" height="32" rx="4" fill="#1A1F71"/>
        <path d="M19.6 21h-3.2l2-12.4h3.2L19.6 21zm12.8-12.1c-.6-.3-1.6-.5-2.8-.5-3.1 0-5.3 1.6-5.3 4 0 1.7 1.6 2.7 2.8 3.3 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.3 0-1.9-.2-3-.6l-.4-.2-.4 2.6c.7.3 2.1.6 3.5.6 3.3 0 5.4-1.6 5.5-4.1 0-1.4-.8-2.4-2.7-3.3-1.1-.6-1.8-.9-1.8-1.5 0-.5.6-1 1.8-1 1 0 1.8.2 2.4.5l.3.1.4-2.6zM38 21l-2.5-12.4h-2.5c-.8 0-1.3.2-1.7 1L27 21h3.3l.7-1.8h4l.4 1.8H38zm-3.9-4.4l1.7-4.5.9 4.5h-2.6zM16 8.6l-3.1 8.5-.3-1.7c-.6-1.9-2.3-4-4.3-5l2.8 10.6h3.3l5-12.4H16z" fill="#fff"/>
        </svg>
    ),
    mastercard: (
        <svg viewBox="0 0 48 32" className="w-10 h-7"><rect width="48" height="32" rx="4" fill="#252525"/>
        <circle cx="19" cy="16" r="8" fill="#EB001B"/><circle cx="29" cy="16" r="8" fill="#F79E1B"/>
        <path d="M24 10.3c1.9 1.4 3 3.5 3 5.7s-1.1 4.3-3 5.7c-1.9-1.4-3-3.5-3-5.7s1.1-4.3 3-5.7z" fill="#FF5F00"/>
        </svg>
    ),
    amex: (
        <svg viewBox="0 0 48 32" className="w-10 h-7"><rect width="48" height="32" rx="4" fill="#2E77BC"/>
        <text x="24" y="19" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">AMEX</text>
        </svg>
    ),
};

const CARD_ELEMENT_OPTS = {
    style: {
        base: {
            fontSize: '16px',
            fontFamily: '"Inter", -apple-system, sans-serif',
            color: '#1a1a1a',
            '::placeholder': { color: '#9ca3af' },
        },
        invalid: { color: '#dc2626' },
    },
    hidePostalCode: true,
};

/* ─── Stripe-wrapped Add Card Form ─── */
function AddCardForm({ onSuccess, onCancel, isDark, t }) {
    const stripe = useStripe();
    const elements = useElements();
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState(null);
    const [cardComplete, setCardComplete] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setAdding(true);
        setError(null);

        try {
            const cardElement = elements.getElement(CardElement);
            const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (stripeError) {
                setError(stripeError.message);
                setAdding(false);
                return;
            }

            // Save to backend
            const { data } = await api.post('/v1/payments/methods', {
                stripePaymentMethodId: paymentMethod.id,
            });
            onSuccess(data.data || {
                id: paymentMethod.id,
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                expMonth: paymentMethod.card.exp_month,
                expYear: paymentMethod.card.exp_year,
                isDefault: false,
            });
        } catch (err) {
            // Fallback: use the Stripe PM data directly even if backend fails
            setError(err.response?.data?.message || 'Failed to save card. Please try again.');
        }
        setAdding(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
        >
            <form onSubmit={handleSubmit} className={`p-5 border-2 ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-warm-400 bg-warm-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">{t('account.securePayment', 'Secure payment via Stripe')}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    {t('account.stripeNote', 'Card details are securely processed by Stripe. We never store your full card number.')}
                </p>
                <div className={`p-4 border mb-4 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-warm-500 bg-warm-50'}`}>
                    <CardElement
                        options={{
                            ...CARD_ELEMENT_OPTS,
                            style: {
                                ...CARD_ELEMENT_OPTS.style,
                                base: {
                                    ...CARD_ELEMENT_OPTS.style.base,
                                    color: isDark ? '#f5f5f5' : '#1a1a1a',
                                },
                            },
                        }}
                        onChange={(e) => {
                            setCardComplete(e.complete);
                            if (e.error) setError(e.error.message);
                            else setError(null);
                        }}
                    />
                </div>
                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-500 mb-4">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                <p className="text-[10px] text-gray-400 mb-4 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Test mode — use card 4242 4242 4242 4242, any future date, any CVC
                </p>
                <div className="flex gap-3">
                    <motion.button
                        type="submit"
                        disabled={adding || !stripe || !cardComplete}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-medium uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                    >
                        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {t('account.addCard', 'Add Card')}
                    </motion.button>
                    <button type="button" onClick={onCancel} className="px-4 py-2.5 border border-warm-400 dark:border-gray-700 text-sm">
                        {t('account.cancel', 'Cancel')}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}

const PaymentsTab = () => {
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    const loadMethods = useCallback(async () => {
        try {
            // Try real API first
            const { data } = await api.get('/v1/payments/methods');
            const items = data.data || data;
            if (Array.isArray(items)) {
                setMethods(items);
                setLoading(false);
                return;
            }
        } catch { /* fall through to mock */ }
        try {
            const data = await authService.getPaymentMethods();
            setMethods(data);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { loadMethods(); }, [loadMethods]);

    const handleAddSuccess = (newPM) => {
        setMethods(prev => [...prev, newPM]);
        setShowAddForm(false);
    };

    const handleRemove = async (id) => {
        try {
            await api.delete(`/v1/payments/methods/${id}`);
        } catch {
            await authService.removePaymentMethod(id);
        }
        setMethods(prev => prev.filter(m => m.id !== id));
    };

    const handleSetDefault = async (id) => {
        try {
            await api.put(`/v1/payments/methods/${id}/default`);
            setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
        } catch {
            const updated = await authService.setDefaultPaymentMethod(id);
            setMethods(updated);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 max-w-2xl">
                {[1, 2].map(i => (
                    <div key={i} className={`h-20 animate-pulse ${isDark ? 'bg-gray-800' : 'bg-warm-300'}`} />
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="font-serif text-xl font-light tracking-tight mb-1">{t('account.paymentMethods', 'Payment Methods')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('account.paymentDesc', 'Manage your saved cards')}</p>
                </div>
                {!showAddForm && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-medium uppercase tracking-wider">
                        <Plus className="w-4 h-4" /> {t('account.addCard', 'Add Card')}
                    </motion.button>
                )}
            </div>

            {/* Add card form with real Stripe Elements */}
            <AnimatePresence>
                {showAddForm && (
                    <Elements stripe={stripePromise}>
                        <AddCardForm onSuccess={handleAddSuccess} onCancel={() => setShowAddForm(false)} isDark={isDark} t={t} />
                    </Elements>
                )}
            </AnimatePresence>

            {/* Cards list */}
            <div className="space-y-3">
                <AnimatePresence>
                    {methods.map(pm => (
                        <motion.div
                            key={pm.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={`flex items-center gap-4 p-4 border-2 transition-all ${
                                pm.isDefault
                                    ? isDark ? 'border-white/30 bg-gray-800/50' : 'border-black/20 bg-warm-200'
                                    : isDark ? 'border-gray-800' : 'border-warm-400'
                            }`}
                        >
                            <div className="shrink-0">
                                {BRAND_ICONS[pm.brand] || <CreditCard className="w-10 h-7 text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium capitalize">{pm.brand}</span>
                                    <span className="text-sm text-gray-500">•••• {pm.last4}</span>
                                    {pm.isDefault && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-black dark:bg-white text-white dark:text-black">
                                            {t('account.default', 'Default')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400">{t('account.expires', 'Expires')} {pm.expMonth}/{pm.expYear}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {!pm.isDefault && (
                                    <button onClick={() => handleSetDefault(pm.id)} title="Set as default"
                                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                        <Star className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => handleRemove(pm.id)} title="Remove card"
                                    className="text-xs text-red-500 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {methods.length === 0 && !showAddForm && (
                <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{t('account.noPaymentMethods', 'No payment methods saved')}</p>
                    <button onClick={() => setShowAddForm(true)} className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-medium uppercase tracking-wider">
                        {t('account.addFirst', 'Add your first card')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentsTab;
