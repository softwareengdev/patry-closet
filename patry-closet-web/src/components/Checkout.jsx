import { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, Lock, Shield, CreditCard, Truck,
    Check, ArrowLeft, ArrowRight, Tag, X, Loader2,
    ShoppingBag, MapPin, Package,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CartContext } from '../context/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const COUNTRIES = [
    { code: 'ES', name: 'Spain' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'IT', name: 'Italy' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'MX', name: 'Mexico' },
    { code: 'AR', name: 'Argentina' },
    { code: 'CO', name: 'Colombia' },
];

const generateOrderNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'PC-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
};

const getEstimatedDelivery = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

/* ─── Step Indicator ─── */
const StepIndicator = ({ currentStep, t }) => {
    const steps = [
        { num: 1, label: t('shippingInfo'), icon: MapPin },
        { num: 2, label: t('payment'), icon: CreditCard },
        { num: 3, label: t('confirmation'), icon: Check },
    ];

    return (
        <div className="flex items-center justify-center mb-8" role="status" aria-label={`Step ${currentStep} of 3`}>
            {steps.map((step, idx) => (
                <div key={step.num} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                            currentStep > step.num
                                ? 'bg-emerald-500 text-white'
                                : currentStep === step.num
                                    ? 'bg-accent-900 text-white dark:bg-white dark:text-gray-900'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                        }`}>
                            {currentStep > step.num ? <Check className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                        </div>
                        <span className={`text-xs mt-1.5 font-medium hidden sm:block ${
                            currentStep >= step.num ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                        }`}>
                            {step.label}
                        </span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={`w-12 sm:w-20 h-0.5 mx-2 sm:mx-3 transition-colors duration-300 ${
                            currentStep > step.num ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                    )}
                </div>
            ))}
        </div>
    );
};

/* ─── Order Summary Sidebar ─── */
const OrderSummary = ({ t, cartItems, getSubtotal, getShipping, getTax, getDiscount, getGrandTotal, coupon, applyCoupon, removeCoupon, compact = false }) => {
    const [couponInput, setCouponInput] = useState('');
    const [couponMsg, setCouponMsg] = useState(null);

    const handleApply = () => {
        const result = applyCoupon(couponInput.trim().toUpperCase());
        setCouponMsg(result);
        if (result.success) setCouponInput('');
        setTimeout(() => setCouponMsg(null), 3000);
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm ${compact ? 'p-4' : 'p-6'} space-y-4`}>
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('orderSummary')}</h3>

            {/* Items */}
            <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin">
                {cartItems.map(item => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3">
                        <div className="relative flex-shrink-0">
                            <img src={item.image} alt={item.name} className="w-14 h-16 object-cover rounded-lg" />
                            <span className="absolute -top-1.5 -right-1.5 bg-gray-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {item.quantity}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.size !== '-' && item.size} {item.color !== '-' && `• ${item.color}`}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            ${(item.price * item.quantity).toFixed(2)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-3" />

            {/* Coupon */}
            {!coupon ? (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder={t('couponCode')}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:border-accent-900 dark:focus:border-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                    />
                    <button onClick={handleApply} className="px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        {t('apply')}
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">{coupon.code}</span>
                    </div>
                    <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
            )}
            {couponMsg && <p className={`text-xs ${couponMsg.success ? 'text-emerald-600' : 'text-red-500'}`}>{couponMsg.message}</p>}

            {/* Totals */}
            <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{t('subtotal')}</span><span>${getSubtotal().toFixed(2)}</span>
                </div>
                {getDiscount() > 0 && (
                    <div className="flex justify-between text-emerald-600">
                        <span>{t('discount')}</span><span>-${getDiscount().toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{t('shipping')}</span><span>{getShipping() === 0 ? t('free') : `$${getShipping().toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{t('tax')} (21%)</span><span>${getTax().toFixed(2)}</span>
                </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{t('total')}</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">${getGrandTotal().toFixed(2)}</span>
            </div>

            {getDiscount() > 0 && (
                <p className="text-sm text-emerald-600 font-medium text-center">🎉 {t('youSave')} ${getDiscount().toFixed(2)}</p>
            )}
        </div>
    );
};

/* ─── Step 1: Shipping ─── */
const ShippingStep = ({ t, formData, setFormData, errors, onContinue }) => {
    const firstRef = useRef(null);
    useEffect(() => { firstRef.current?.focus(); }, []);

    const Field = ({ name, label, type = 'text', required = false, colSpan = '', placeholder = '' }) => (
        <div className={colSpan}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                ref={name === 'email' ? firstRef : undefined}
                id={name}
                type={type}
                value={formData[name] || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, [name]: e.target.value }))}
                placeholder={placeholder}
                className={`w-full px-4 py-3 rounded-xl border bg-transparent text-sm focus:outline-none transition-colors ${
                    errors[name]
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 dark:border-gray-700 focus:border-accent-900 dark:focus:border-white'
                }`}
                aria-invalid={!!errors[name]}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
            />
            {errors[name] && (
                <p id={`${name}-error`} className="text-xs text-red-500 mt-1" role="alert">{errors[name]}</p>
            )}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
        >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('shippingAddress')}</h2>
            <div className="space-y-4">
                <Field name="email" label={t('email')} type="email" required placeholder="you@example.com" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field name="firstName" label={t('firstName')} required />
                    <Field name="lastName" label={t('lastName')} required />
                </div>
                <Field name="address1" label={t('addressLine1')} required />
                <Field name="address2" label={t('addressLine2')} placeholder={t('addressLine2')} />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field name="city" label={t('city')} required />
                    <Field name="state" label={t('stateProvince')} />
                    <Field name="postalCode" label={t('postalCode')} required />
                </div>
                <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('country')} <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="country"
                        value={formData.country || 'ES'}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:border-accent-900 dark:focus:border-white"
                    >
                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                </div>
                <Field name="phone" label={t('phone')} type="tel" />

                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.saveAddress || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, saveAddress: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-accent-900 focus:ring-accent-900"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('saveAddress')}</span>
                </label>
            </div>

            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onContinue}
                className="mt-8 w-full flex items-center justify-center gap-2 py-3.5 bg-accent-900 text-white rounded-xl font-medium text-sm uppercase tracking-wider hover:bg-accent-800 transition-colors"
            >
                {t('continueToPayment')} <ArrowRight className="w-4 h-4" />
            </motion.button>
        </motion.div>
    );
};

/* ─── Step 2: Payment (inner, uses Stripe hooks) ─── */
const PaymentForm = ({ t, onBack, onComplete, isProcessing, setIsProcessing }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [cardError, setCardError] = useState(null);

    const handleSubmit = async () => {
        setIsProcessing(true);
        setCardError(null);

        // Simulate payment processing (no real backend)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In production, you'd call stripe.confirmPayment here
        if (stripe && elements) {
            const cardElement = elements.getElement(CardElement);
            if (cardElement) {
                // Mock: just check that stripe loaded
                setIsProcessing(false);
                onComplete();
                return;
            }
        }

        setIsProcessing(false);
        onComplete();
    };

    const cardStyle = {
        style: {
            base: {
                fontSize: '16px',
                color: '#374151',
                '::placeholder': { color: '#9CA3AF' },
                fontFamily: 'Inter, system-ui, sans-serif',
            },
            invalid: { color: '#EF4444' },
        },
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
        >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('paymentMethod')}</h2>

            {/* Express Pay (mock) */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-medium">{t('expressPay')}</p>
                <div className="flex gap-3">
                    <button disabled className="flex-1 py-3 bg-black text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed flex items-center justify-center gap-2">
                         Pay <span className="text-[10px] ml-1 px-1.5 py-0.5 bg-white/20 rounded">{t('comingSoon')}</span>
                    </button>
                    <button disabled className="flex-1 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed flex items-center justify-center gap-2">
                        G Pay <span className="text-[10px] ml-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">{t('comingSoon')}</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Card Element */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('creditDebitCard')}
                    </label>
                    <div className="px-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                        <CardElement options={cardStyle} onChange={(e) => setCardError(e.error?.message || null)} />
                    </div>
                    {cardError && <p className="text-xs text-red-500 mt-1">{cardError}</p>}
                </div>
            </div>

            {/* Security badges */}
            <div className="flex items-center justify-center gap-6 mt-6 py-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Lock className="w-3.5 h-3.5" /> {t('secureCheckout')}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Shield className="w-3.5 h-3.5" /> {t('encryption256')}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent-900 text-white rounded-xl font-medium text-sm uppercase tracking-wider hover:bg-accent-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {t('processing')}</>
                    ) : (
                        <><Lock className="w-4 h-4" /> {t('placeOrder')}</>
                    )}
                </motion.button>
                <button
                    onClick={onBack}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-30"
                >
                    <ArrowLeft className="w-4 h-4" /> {t('backToShipping')}
                </button>
            </div>
        </motion.div>
    );
};

/* ─── Step 2 Wrapper (provides Stripe context) ─── */
const PaymentStep = ({ t, onBack, onComplete }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const appearance = { theme: 'stripe', variables: { fontFamily: 'Inter, system-ui, sans-serif' } };

    return (
        <Elements stripe={stripePromise} options={{ appearance }}>
            <PaymentForm
                t={t}
                onBack={onBack}
                onComplete={onComplete}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
            />
        </Elements>
    );
};

/* ─── Step 3: Confirmation ─── */
const ConfirmationStep = ({ t, orderNumber, formData, cartItems, grandTotal, navigate }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-lg mx-auto"
        >
            {/* Success animation */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, delay: 0.4 }}
                >
                    <Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                </motion.div>
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('orderConfirmed')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{t('thankYouMessage')}</p>

            {/* Order details card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 text-left space-y-4 mb-8">
                <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('orderNumber')}</span>
                    <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">{orderNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('estimatedDelivery')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Package className="w-4 h-4" /> {getEstimatedDelivery()}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('shipping')}</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                        {formData.address1}, {formData.city}, {formData.postalCode}
                    </span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">{t('total')}</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">${grandTotal.toFixed(2)}</span>
                </div>

                {/* Items mini-list */}
                <div className="space-y-2 pt-2">
                    {cartItems.map(item => (
                        <div key={`${item.id}-${item.size}`} className="flex items-center gap-3 text-sm">
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" />
                            <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{item.name}</span>
                            <span className="text-gray-500">×{item.quantity}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => navigate('/products')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent-900 text-white rounded-xl font-medium text-sm hover:bg-accent-800 transition-colors"
                >
                    {t('continueShopping')} <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed"
                >
                    {t('viewOrder')}
                </button>
            </div>
        </motion.div>
    );
};

/* ─── Main Checkout Component ─── */
const Checkout = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const {
        cartItems, getSubtotal, getShipping, getTax, getDiscount, getGrandTotal,
        getItemCount, coupon, applyCoupon, removeCoupon, clearCart,
    } = useContext(CartContext);

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ country: 'ES' });
    const [errors, setErrors] = useState({});
    const [orderNumber] = useState(() => generateOrderNumber());
    const [confirmedItems, setConfirmedItems] = useState([]);
    const [confirmedTotal, setConfirmedTotal] = useState(0);

    // Validate shipping form
    const validateShipping = () => {
        const newErrors = {};
        if (!formData.email?.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
        if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.address1?.trim()) newErrors.address1 = 'Address is required';
        if (!formData.city?.trim()) newErrors.city = 'City is required';
        if (!formData.postalCode?.trim()) newErrors.postalCode = 'Postal code is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleShippingContinue = () => {
        if (validateShipping()) setStep(2);
    };

    const handlePaymentComplete = () => {
        setConfirmedItems([...cartItems]);
        setConfirmedTotal(getGrandTotal());
        clearCart();
        setStep(3);
    };

    // Empty cart redirect (but not on step 3)
    if (cartItems.length === 0 && step !== 3) {
        return (
            <section className="py-20 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md px-6">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('emptyCartCheckout')}</h2>
                    <p className="text-gray-500 mb-6">{t('emptyCartCheckoutMessage')}</p>
                    <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-accent-900 text-white rounded-xl font-medium hover:bg-accent-800 transition-colors">
                        {t('shopNow')} <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </section>
        );
    }

    return (
        <section className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium text-gray-900 dark:text-white">{t('guestCheckout')}</span>
                        <span>•</span>
                        <span>{t('haveAccount')} <Link to="/profile" className="text-accent-900 dark:text-white underline">{t('signIn')}</Link></span>
                    </div>
                    <Lock className="w-4 h-4 text-gray-400" />
                </div>

                <StepIndicator currentStep={step} t={t} />

                <div className={`grid grid-cols-1 ${step < 3 ? 'lg:grid-cols-5' : ''} gap-8`}>
                    {/* Step Content */}
                    <div className={step < 3 ? 'lg:col-span-3' : ''}>
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <ShippingStep
                                    key="shipping"
                                    t={t}
                                    formData={formData}
                                    setFormData={setFormData}
                                    errors={errors}
                                    onContinue={handleShippingContinue}
                                />
                            )}
                            {step === 2 && (
                                <PaymentStep
                                    key="payment"
                                    t={t}
                                    onBack={() => setStep(1)}
                                    onComplete={handlePaymentComplete}
                                />
                            )}
                            {step === 3 && (
                                <ConfirmationStep
                                    key="confirmation"
                                    t={t}
                                    orderNumber={orderNumber}
                                    formData={formData}
                                    cartItems={confirmedItems}
                                    grandTotal={confirmedTotal}
                                    navigate={navigate}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary (steps 1 & 2 only) */}
                    {step < 3 && (
                        <div className="lg:col-span-2">
                            <div className="sticky top-24">
                                <OrderSummary
                                    t={t}
                                    cartItems={cartItems}
                                    getSubtotal={getSubtotal}
                                    getShipping={getShipping}
                                    getTax={getTax}
                                    getDiscount={getDiscount}
                                    getGrandTotal={getGrandTotal}
                                    coupon={coupon}
                                    applyCoupon={applyCoupon}
                                    removeCoupon={removeCoupon}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Checkout;
