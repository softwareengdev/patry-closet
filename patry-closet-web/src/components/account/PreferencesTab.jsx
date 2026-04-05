import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Palette, Sparkles, Check, Save, Loader2 } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const STYLE_TAGS = [
    { id: 'minimal', emoji: '🤍', label: 'Minimal' },
    { id: 'streetwear', emoji: '🔥', label: 'Streetwear' },
    { id: 'elegant', emoji: '✨', label: 'Elegant' },
    { id: 'bohemian', emoji: '🌿', label: 'Bohemian' },
    { id: 'sporty', emoji: '⚡', label: 'Sporty' },
    { id: 'classic', emoji: '💎', label: 'Classic' },
    { id: 'sustainable', emoji: '♻️', label: 'Sustainable' },
    { id: 'vintage', emoji: '🎭', label: 'Vintage' },
    { id: 'avant-garde', emoji: '🖤', label: 'Avant-Garde' },
    { id: 'preppy', emoji: '🎓', label: 'Preppy' },
];

const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

const COLORS = [
    { id: 'black', hex: '#000000', label: 'Black' },
    { id: 'white', hex: '#FFFFFF', label: 'White' },
    { id: 'beige', hex: '#D4B896', label: 'Beige' },
    { id: 'navy', hex: '#1B2A4A', label: 'Navy' },
    { id: 'red', hex: '#C41E3A', label: 'Red' },
    { id: 'pink', hex: '#E8A0BF', label: 'Pink' },
    { id: 'green', hex: '#4A7C59', label: 'Green' },
    { id: 'brown', hex: '#6B4226', label: 'Brown' },
    { id: 'gray', hex: '#808080', label: 'Gray' },
    { id: 'blue', hex: '#4169E1', label: 'Blue' },
    { id: 'camel', hex: '#C19A6B', label: 'Camel' },
    { id: 'burgundy', hex: '#722F37', label: 'Burgundy' },
];

const CATEGORIES = [
    { id: 'dresses', label: 'Dresses', emoji: '👗' },
    { id: 'tops', label: 'Tops', emoji: '👚' },
    { id: 'pants', label: 'Pants', emoji: '👖' },
    { id: 'shoes', label: 'Shoes', emoji: '👠' },
    { id: 'bags', label: 'Bags', emoji: '👜' },
    { id: 'jewelry', label: 'Jewelry', emoji: '💍' },
    { id: 'coats', label: 'Coats', emoji: '🧥' },
    { id: 'skirts', label: 'Skirts', emoji: '🩱' },
    { id: 'swimwear', label: 'Swimwear', emoji: '👙' },
    { id: 'activewear', label: 'Activewear', emoji: '🏃‍♀️' },
];

const BRANDS = ['Zara', 'Massimo Dutti', 'Mango', 'H&M', 'COS', 'Uniqlo', '& Other Stories', 'Arket', 'Sandro', 'Reiss', 'AllSaints', 'Reformation'];

const PreferencesTab = () => {
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const { user, updatePreferences } = useAuth();

    const [styles, setStyles] = useState(user?.preferences?.stylePreferences || []);
    const [sizes, setSizes] = useState(user?.preferences?.favoriteSizes || []);
    const [colors, setColors] = useState(user?.preferences?.favoriteColors || []);
    const [categories, setCategories] = useState(user?.preferences?.favoriteCategories || []);
    const [brands, setBrands] = useState(user?.preferences?.favoriteBrands || []);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const toggle = (arr, setArr, item) => {
        setArr(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        await updatePreferences({
            stylePreferences: styles,
            favoriteSizes: sizes,
            favoriteColors: colors,
            favoriteCategories: categories,
            favoriteBrands: brands,
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const ChipButton = ({ active, onClick, children, className = '' }) => (
        <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className={`relative px-3.5 py-2 text-sm font-medium transition-all border-2 ${
                active
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                    : isDark
                        ? 'border-gray-700 hover:border-gray-600 text-gray-300'
                        : 'border-warm-400 hover:border-warm-500 text-gray-700'
            } ${className}`}
        >
            {active && <Check className="w-3 h-3 inline mr-1" />}
            {children}
        </motion.button>
    );

    return (
        <div className="max-w-2xl">
            <h2 className="font-serif text-xl font-light tracking-tight mb-1">{t('account.preferences', 'Style Preferences')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                {t('account.preferencesSubtitle', 'Tell us about your style to get personalized recommendations')}
            </p>

            {/* My Style */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-pink-500" />
                    <h3 className="font-semibold">{t('account.myStyle', 'My Style')}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {STYLE_TAGS.map(tag => (
                        <ChipButton key={tag.id} active={styles.includes(tag.id)} onClick={() => toggle(styles, setStyles, tag.id)}>
                            {tag.emoji} {tag.label}
                        </ChipButton>
                    ))}
                </div>
            </div>

            {/* Favorite Sizes */}
            <div className="mb-8">
                <h3 className="font-semibold mb-3">{t('account.favSizes', 'Favorite Sizes')}</h3>
                <div className="flex flex-wrap gap-2">
                    {SIZES.map(size => (
                        <ChipButton key={size} active={sizes.includes(size)} onClick={() => toggle(sizes, setSizes, size)}
                            className="min-w-[3rem] justify-center">
                            {size}
                        </ChipButton>
                    ))}
                </div>
            </div>

            {/* Favorite Colors */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold">{t('account.favColors', 'Favorite Colors')}</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                    {COLORS.map(color => (
                        <motion.button
                            key={color.id}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggle(colors, setColors, color.id)}
                            className={`relative w-10 h-10 rounded-full border-3 transition-all ${
                                colors.includes(color.id)
                                    ? 'ring-2 ring-offset-2 ring-black dark:ring-white ring-offset-white dark:ring-offset-gray-950'
                                    : 'hover:ring-2 hover:ring-offset-1 hover:ring-gray-300'
                            }`}
                            style={{ backgroundColor: color.hex, borderColor: color.id === 'white' ? '#e5e7eb' : color.hex }}
                            title={color.label}
                            aria-label={`${color.label} ${colors.includes(color.id) ? '(selected)' : ''}`}
                        >
                            {colors.includes(color.id) && (
                                <Check className={`w-4 h-4 absolute inset-0 m-auto ${color.id === 'white' || color.id === 'beige' ? 'text-black' : 'text-white'}`} />
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Favorite Categories */}
            <div className="mb-8">
                <h3 className="font-semibold mb-3">{t('account.favCategories', 'Favorite Categories')}</h3>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                        <ChipButton key={cat.id} active={categories.includes(cat.id)} onClick={() => toggle(categories, setCategories, cat.id)}>
                            {cat.emoji} {cat.label}
                        </ChipButton>
                    ))}
                </div>
            </div>

            {/* Favorite Brands */}
            <div className="mb-8">
                <h3 className="font-semibold mb-3">{t('account.favBrands', 'Favorite Brands')}</h3>
                <div className="flex flex-wrap gap-2">
                    {BRANDS.map(brand => (
                        <ChipButton key={brand} active={brands.includes(brand)} onClick={() => toggle(brands, setBrands, brand)}>
                            {brand}
                        </ChipButton>
                    ))}
                </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-4 pt-4 border-t border-warm-400 dark:border-gray-800">
                <motion.button
                    onClick={handleSave}
                    disabled={saving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-medium text-sm uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />{t('account.saving', 'Saving...')}</>
                     : saved ? <><Check className="w-4 h-4" />{t('account.saved', 'Saved!')}</>
                     : <><Save className="w-4 h-4" />{t('account.savePreferences', 'Save Preferences')}</>}
                </motion.button>
                <AnimatePresence>
                    {saved && (
                        <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                            className="text-sm text-green-600 dark:text-green-400">
                            ✓ {t('account.preferencesSaved', 'Preferences updated!')}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PreferencesTab;
