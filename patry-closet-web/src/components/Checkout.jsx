import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement } from '@stripe/react-stripe-js';
import {
  Check, ChevronDown, ChevronUp, Lock, Shield,
  CreditCard, Package, MapPin, Mail, Phone,
  User, ShoppingBag, Loader2, Tag, X, Truck, AlertCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';

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

const slideVariants = {
  enter: (d) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
};

function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'PC-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function getEstimatedDelivery() {
  const addBizDays = (from, n) => {
    const d = new Date(from);
    let added = 0;
    while (added < n) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) added++;
    }
    return d;
  };
  const now = new Date();
  const opts = { month: 'short', day: 'numeric' };
  const start = addBizDays(now, 5).toLocaleDateString('en-US', opts);
  const end = addBizDays(now, 7).toLocaleDateString('en-US', opts);
  return `${start} \u2013 ${end}`;
}

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const fmt = (n) => `$${Number(n).toFixed(2)}`;

/* ------------------------------------------------------------------ */
/*  StepIndicator                                                      */
/* ------------------------------------------------------------------ */
function StepIndicator({ current, t }) {
  const steps = [
    { key: 'shipping', icon: MapPin },
    { key: 'payment', icon: CreditCard },
    { key: 'confirmation', icon: Package },
  ];

  return (
    <nav
      role="status"
      aria-label={t('checkoutProgress') || 'Checkout progress'}
      className="flex items-center justify-center mb-8 px-4"
    >
      {steps.map((s, i) => {
        const Icon = i < current ? Check : s.icon;
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.key} className="flex items-center">
            {i > 0 && (
              <div
                className={`h-px w-10 sm:w-16 md:w-20 transition-colors duration-500 ${
                  i <= current ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                  done
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : active
                      ? 'bg-black dark:bg-white text-white dark:text-black ring-4 ring-black/10 dark:ring-white/20'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] sm:text-xs font-medium whitespace-nowrap ${
                  i <= current ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {t(s.key)}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  FormField                                                          */
/* ------------------------------------------------------------------ */
function FormField({ label, id, type = 'text', value, onChange, error, required, icon: Icon, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`w-full rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 py-2.5 focus:outline-none focus:ring-2 transition-colors ${
            Icon ? 'pl-10 pr-3' : 'px-3'
          } ${
            error
              ? 'border-red-500 focus:ring-red-500/40'
              : 'border-gray-300 dark:border-gray-600 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black dark:focus:border-white'
          }`}
          {...rest}
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-err`}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-500 text-xs mt-1 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  OrderSummary                                                       */
/* ------------------------------------------------------------------ */
function OrderSummary({ data, collapsible = false, t }) {
  const [open, setOpen] = useState(!collapsible);
  const { items, subtotal, discount, shipping, tax, grandTotal, coupon, itemCount } = data;
  const freeShipThreshold = 50;
  const progress = Math.min((subtotal / freeShipThreshold) * 100, 100);
  const remaining = Math.max(freeShipThreshold - subtotal, 0);

  const content = (
    <div className="space-y-4">
      {/* Items */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div key={`${item.id}-${item.size}-${item.color}-${idx}`} className="flex gap-3">
            <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
              {item.image || item.images?.[0] ? (
                <img
                  src={item.image || item.images[0]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.size && <span>{t('size')}: {item.size}</span>}
                {item.size && item.color && <span className="mx-1">&middot;</span>}
                {item.color && <span>{t('color')}: {item.color}</span>}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
              {fmt(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>{t('subtotal') || 'Subtotal'}</span>
          <span>{fmt(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {t('discount')}
              {coupon && <span className="text-xs">({coupon.code})</span>}
            </span>
            <span>-{fmt(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Truck className="w-3 h-3" />
            {t('shipping')}
          </span>
          {shipping === 0 ? (
            <span className="text-green-600 dark:text-green-400 font-medium">
              {t('freeShipping') || 'Free'}
            </span>
          ) : (
            <span>{fmt(shipping)}</span>
          )}
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>{t('tax')} (21% IVA)</span>
          <span>{fmt(tax)}</span>
        </div>
      </div>

      {/* Grand total */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-gray-900 dark:text-white">{t('grandTotal')}</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">{fmt(grandTotal)}</span>
        </div>
        {discount > 0 && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-1 text-right">
            {t('youSave') || 'You save'} {fmt(discount)}
          </p>
        )}
      </div>

      {/* Free shipping progress */}
      {shipping > 0 && subtotal < freeShipThreshold && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Add <span className="font-semibold text-gray-900 dark:text-white">{fmt(remaining)}</span> more
            for free shipping!
          </p>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-black dark:bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (collapsible) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between p-4 text-left"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            <ShoppingBag className="w-4 h-4" />
            {t('orderSummary') || 'Order Summary'} ({itemCount})
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white">{fmt(grandTotal)}</span>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">{content}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-900">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" />
        {t('orderSummary') || 'Order Summary'}
      </h2>
      {content}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ShippingStep                                                       */
/* ------------------------------------------------------------------ */
function ShippingStep({ data, setData, errors, onContinue, t }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div id="checkout-step-0" className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        {t('shippingInfo') || 'Shipping Information'}
      </h2>

      <div aria-live="polite" className="space-y-4">
        <FormField
          id="email"
          label={t('email') || 'Email'}
          type="email"
          required
          value={data.email}
          onChange={handleChange}
          error={errors.email}
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="firstName"
            label={t('firstName') || 'First Name'}
            required
            value={data.firstName}
            onChange={handleChange}
            error={errors.firstName}
            icon={User}
            placeholder="John"
            autoComplete="given-name"
          />
          <FormField
            id="lastName"
            label={t('lastName') || 'Last Name'}
            required
            value={data.lastName}
            onChange={handleChange}
            error={errors.lastName}
            placeholder="Doe"
            autoComplete="family-name"
          />
        </div>

        <FormField
          id="address1"
          label={t('address') || 'Address Line 1'}
          required
          value={data.address1}
          onChange={handleChange}
          error={errors.address1}
          icon={MapPin}
          placeholder="123 Main St"
          autoComplete="address-line1"
        />
        <FormField
          id="address2"
          label={t('address2') || 'Address Line 2'}
          value={data.address2}
          onChange={handleChange}
          placeholder="Apt, suite, etc. (optional)"
          autoComplete="address-line2"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            id="city"
            label={t('city') || 'City'}
            required
            value={data.city}
            onChange={handleChange}
            error={errors.city}
            placeholder="Madrid"
            autoComplete="address-level2"
          />
          <FormField
            id="state"
            label={t('stateProvince') || 'State / Province'}
            value={data.state}
            onChange={handleChange}
            placeholder="Madrid"
            autoComplete="address-level1"
          />
          <FormField
            id="postalCode"
            label={t('postalCode') || 'Postal Code'}
            required
            value={data.postalCode}
            onChange={handleChange}
            error={errors.postalCode}
            placeholder="28001"
            autoComplete="postal-code"
          />
        </div>

        {/* Country */}
        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {t('country') || 'Country'}
          </label>
          <select
            id="country"
            name="country"
            value={data.country}
            onChange={handleChange}
            aria-label={t('country') || 'Country'}
            autoComplete="country"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black dark:focus:border-white transition-colors"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <FormField
          id="phone"
          label={t('phone') || 'Phone'}
          type="tel"
          value={data.phone}
          onChange={handleChange}
          icon={Phone}
          placeholder="+34 600 000 000"
          autoComplete="tel"
        />

        {/* Save address */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            name="saveAddress"
            checked={data.saveAddress}
            onChange={handleChange}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black dark:focus:ring-white accent-black dark:accent-white"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {t('saveAddress') || 'Save this address for future orders'}
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
      >
        {t('continueToPayment') || 'Continue to Payment'}
        <CreditCard className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PaymentStepContent  (must be rendered inside <Elements>)           */
/* ------------------------------------------------------------------ */
function PaymentStepContent({ onBack, onPlaceOrder, processing, coupon, applyCoupon, removeCoupon, t }) {
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const isDark = document.documentElement.classList.contains('dark');

  const cardOptions = useMemo(
    () => ({
      style: {
        base: {
          fontSize: '16px',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: isDark ? '#f9fafb' : '#111827',
          iconColor: isDark ? '#9ca3af' : '#6b7280',
          '::placeholder': { color: isDark ? '#6b7280' : '#9ca3af' },
        },
        invalid: { color: '#ef4444', iconColor: '#ef4444' },
      },
    }),
    [isDark],
  );

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const result = applyCoupon(couponCode.trim());
    setCouponMsg(result);
    if (result.success) setCouponCode('');
    setTimeout(() => setCouponMsg(null), 4000);
  };

  return (
    <div id="checkout-step-1" className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <CreditCard className="w-5 h-5" />
        {t('payment') || 'Payment'}
      </h2>

      {/* Express Checkout */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('expressCheckout') || 'Express Checkout'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled
            className="relative flex items-center justify-center gap-2 py-3 bg-black text-white rounded-lg opacity-50 cursor-not-allowed text-sm font-medium"
          >
            {'\uF8FF'} Apple Pay
            <span className="absolute -top-2 -right-2 text-[10px] bg-gray-500 text-white px-1.5 py-0.5 rounded-full leading-tight">
              {t('comingSoon') || 'Soon'}
            </span>
          </button>
          <button
            type="button"
            disabled
            className="relative flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg opacity-50 cursor-not-allowed text-sm font-medium"
          >
            Google Pay
            <span className="absolute -top-2 -right-2 text-[10px] bg-gray-500 text-white px-1.5 py-0.5 rounded-full leading-tight">
              {t('comingSoon') || 'Soon'}
            </span>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-gray-900 px-4 text-gray-500 dark:text-gray-400">
            {t('orPayWithCard') || 'or pay with card'}
          </span>
        </div>
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('cardDetails') || 'Card Details'}
        </label>
        <div
          className={`border rounded-lg p-3.5 bg-white dark:bg-gray-800 transition-colors focus-within:ring-2 focus-within:border-black dark:focus-within:border-white ${
            cardComplete
              ? 'border-green-400 dark:border-green-500 focus-within:ring-green-500/20'
              : 'border-gray-300 dark:border-gray-600 focus-within:ring-black/20 dark:focus-within:ring-white/20'
          }`}
        >
          <CardElement options={cardOptions} onChange={(e) => setCardComplete(e.complete)} />
        </div>
      </div>

      {/* Coupon */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Tag className="w-4 h-4" />
          {t('couponCode') || 'Coupon Code'}
        </p>
        {coupon ? (
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2.5">
            <span className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              {coupon.code}
              {coupon.type === 'percent' && ` (-${coupon.value}%)`}
              {coupon.type === 'shipping' && ` (${t('freeShipping') || 'Free shipping'})`}
            </span>
            <button
              type="button"
              onClick={removeCoupon}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded transition-colors"
              aria-label={t('removeCoupon') || 'Remove coupon'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="PATRY10"
              aria-label={t('couponCode') || 'Coupon code'}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black dark:focus:border-white transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('apply') || 'Apply'}
            </button>
          </div>
        )}
        <AnimatePresence>
          {couponMsg && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`text-xs ${couponMsg.success ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}
              role="status"
            >
              {couponMsg.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Security badges */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 py-3 border-t border-b border-gray-100 dark:border-gray-800">
        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Lock className="w-3.5 h-3.5" />
          {t('secureCheckout') || 'Secure Checkout'}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Shield className="w-3.5 h-3.5" />
          256-bit SSL
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Check className="w-3.5 h-3.5" />
          PCI Compliant
        </span>
      </div>

      {/* Place Order */}
      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={processing || !cardComplete}
        className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-3.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('processing') || 'Processing\u2026'}
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            {t('placeOrder') || 'Place Order'}
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onBack}
        disabled={processing}
        className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-2 disabled:opacity-40"
      >
        {'\u2190'} {t('backToShipping') || 'Back to Shipping'}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PaymentStep  (Elements wrapper)                                    */
/* ------------------------------------------------------------------ */
function PaymentStep(props) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentStepContent {...props} />
    </Elements>
  );
}

/* ------------------------------------------------------------------ */
/*  ConfirmationStep                                                   */
/* ------------------------------------------------------------------ */
function ConfirmationStep({ order, navigate, clearCart, t }) {
  useEffect(() => {
    clearCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!order) return null;

  const delivery = getEstimatedDelivery();

  return (
    <div id="checkout-step-2" className="text-center space-y-6 py-4">
      {/* Animated checkmark */}
      <motion.div
        className="mx-auto w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/25"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }}>
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('orderConfirmed') || 'Order Confirmed!'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('thankYou') || 'Thank you for your purchase'}
        </p>
      </div>

      {/* Order number */}
      <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2.5">
        <Package className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {t('orderNumber') || 'Order'}:
        </span>
        <span className="font-mono font-bold text-gray-900 dark:text-white">
          {order.orderNumber}
        </span>
      </div>

      {/* Order details card */}
      <div className="text-left bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 space-y-4 max-w-md mx-auto">
        {/* Shipping address */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            {t('shippingTo') || 'Shipping to'}
          </p>
          <p className="text-sm text-gray-900 dark:text-white">
            {order.shippingData.firstName} {order.shippingData.lastName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {order.shippingData.address1}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {order.shippingData.city}
            {order.shippingData.state ? `, ${order.shippingData.state}` : ''}{' '}
            {order.shippingData.postalCode}
          </p>
        </div>

        {/* Items */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            {t('items') || 'Items'} ({order.items.length})
          </p>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span className="text-gray-700 dark:text-gray-300 truncate mr-2">
                {item.name} {'\u00D7'} {item.quantity}
              </span>
              <span className="text-gray-900 dark:text-white font-medium whitespace-nowrap">
                {fmt(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-base font-bold text-gray-900 dark:text-white">
          <span>{t('total')}</span>
          <span>{fmt(order.grandTotal)}</span>
        </div>

        {/* Estimated delivery */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Truck className="w-4 h-4 flex-shrink-0" />
          <span>
            {t('estimatedDelivery') || 'Estimated delivery'}:{' '}
            <strong className="text-gray-900 dark:text-white">{delivery}</strong>
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="flex-1 bg-black dark:bg-white text-white dark:text-black font-semibold py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          {t('continueShopping') || 'Continue Shopping'}
        </button>
        <button
          type="button"
          disabled
          className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 font-semibold py-3 rounded-lg cursor-not-allowed"
        >
          {t('viewOrder') || 'View Order'}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Checkout  (main)                                                   */
/* ------------------------------------------------------------------ */
function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    cartItems,
    getSubtotal,
    getShipping,
    getTax,
    getDiscount,
    getGrandTotal,
    getItemCount,
    coupon,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCart();

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const [shippingData, setShippingData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'ES',
    phone: '',
    saveAddress: false,
  });

  const [errors, setErrors] = useState({});

  // Focus first input when step changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById(`checkout-step-${currentStep}`);
      if (el) {
        const input = el.querySelector('input, select, textarea');
        if (input) input.focus();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleShippingContinue = useCallback(() => {
    const errs = {};
    if (!shippingData.email) errs.email = t('fieldRequired') || 'Required';
    else if (!isValidEmail(shippingData.email)) errs.email = t('invalidEmail') || 'Invalid email address';
    if (!shippingData.firstName.trim()) errs.firstName = t('fieldRequired') || 'Required';
    if (!shippingData.lastName.trim()) errs.lastName = t('fieldRequired') || 'Required';
    if (!shippingData.address1.trim()) errs.address1 = t('fieldRequired') || 'Required';
    if (!shippingData.city.trim()) errs.city = t('fieldRequired') || 'Required';
    if (!shippingData.postalCode.trim()) errs.postalCode = t('fieldRequired') || 'Required';

    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setDirection(1);
      setCurrentStep(1);
    }
  }, [shippingData, t]);

  const handlePlaceOrder = useCallback(async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    const orderNum = generateOrderNumber();
    setCompletedOrder({
      orderNumber: orderNum,
      items: [...cartItems],
      shippingData: { ...shippingData },
      subtotal: getSubtotal(),
      discount: getDiscount(),
      shipping: getShipping(),
      tax: getTax(),
      grandTotal: getGrandTotal(),
      coupon,
    });
    setProcessing(false);
    setDirection(1);
    setCurrentStep(2);
  }, [cartItems, shippingData, getSubtotal, getDiscount, getShipping, getTax, getGrandTotal, coupon]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  // Summary data: live cart on steps 0-1, snapshot on step 2
  const summaryData = useMemo(() => {
    if (currentStep === 2 && completedOrder) {
      return {
        items: completedOrder.items,
        subtotal: completedOrder.subtotal,
        discount: completedOrder.discount,
        shipping: completedOrder.shipping,
        tax: completedOrder.tax,
        grandTotal: completedOrder.grandTotal,
        coupon: completedOrder.coupon,
        itemCount: completedOrder.items.reduce((s, i) => s + i.quantity, 0),
      };
    }
    return {
      items: cartItems,
      subtotal: getSubtotal(),
      discount: getDiscount(),
      shipping: getShipping(),
      tax: getTax(),
      grandTotal: getGrandTotal(),
      coupon,
      itemCount: getItemCount(),
    };
  }, [currentStep, completedOrder, cartItems, getSubtotal, getDiscount, getShipping, getTax, getGrandTotal, coupon, getItemCount]);

  /* ---- Empty cart ---- */
  if (cartItems.length === 0 && currentStep < 2) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('emptyCart') || 'Your cart is empty'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('emptyCartMsg') || 'Add some items to get started'}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {t('shopNow') || 'Shop Now'}
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ---- Main layout ---- */
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-serif">
            {t('checkout')}
          </h1>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded mt-1 inline-block">
            {t('guestCheckout') || 'Guest Checkout'}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('haveAccount') || 'Have an account?'}{' '}
          <button
            type="button"
            onClick={() => navigate('/login?redirect=%2Fcheckout')}
            className="text-black dark:text-white font-medium underline underline-offset-2 hover:no-underline"
          >
            {t('signIn') || 'Sign in'}
          </button>
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={currentStep} t={t} />

      {/* Grid: steps + sidebar */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-8">
        {/* Mobile order summary */}
        <div className="lg:hidden mb-6">
          <OrderSummary data={summaryData} collapsible t={t} />
        </div>

        {/* Step content */}
        <div className="lg:col-span-3 min-h-[420px]">
          <AnimatePresence mode="wait" custom={direction}>
            {currentStep === 0 && (
              <motion.div
                key="shipping"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <ShippingStep
                  data={shippingData}
                  setData={setShippingData}
                  errors={errors}
                  onContinue={handleShippingContinue}
                  t={t}
                />
              </motion.div>
            )}
            {currentStep === 1 && (
              <motion.div
                key="payment"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <PaymentStep
                  onBack={goBack}
                  onPlaceOrder={handlePlaceOrder}
                  processing={processing}
                  coupon={coupon}
                  applyCoupon={applyCoupon}
                  removeCoupon={removeCoupon}
                  t={t}
                />
              </motion.div>
            )}
            {currentStep === 2 && (
              <motion.div
                key="confirmation"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <ConfirmationStep
                  order={completedOrder}
                  navigate={navigate}
                  clearCart={clearCart}
                  t={t}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="sticky top-24">
            <OrderSummary data={summaryData} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
