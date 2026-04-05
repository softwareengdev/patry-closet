import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const sizeData = {
    women: {
        headers: ['Size', 'EU', 'Bust (cm)', 'Waist (cm)', 'Hips (cm)'],
        rows: [
            ['XS', '34', '80-84', '60-64', '86-90'],
            ['S', '36', '84-88', '64-68', '90-94'],
            ['M', '38', '88-92', '68-72', '94-98'],
            ['L', '40', '92-96', '72-76', '98-102'],
            ['XL', '42', '96-100', '76-80', '102-106'],
        ],
    },
    men: {
        headers: ['Size', 'EU', 'Chest (cm)', 'Waist (cm)', 'Hips (cm)'],
        rows: [
            ['XS', '44', '86-90', '72-76', '88-92'],
            ['S', '46', '90-94', '76-80', '92-96'],
            ['M', '48', '94-98', '80-84', '96-100'],
            ['L', '50', '98-102', '84-88', '100-104'],
            ['XL', '52', '102-106', '88-92', '104-108'],
        ],
    },
    shoes: {
        headers: ['EU', 'US Women', 'US Men', 'UK', 'cm'],
        rows: [
            ['36', '5.5', '4', '3.5', '22.5'],
            ['37', '6.5', '5', '4', '23.5'],
            ['38', '7.5', '5.5', '5', '24'],
            ['39', '8', '6', '5.5', '24.5'],
            ['40', '9', '7', '6.5', '25.5'],
            ['41', '9.5', '8', '7', '26'],
            ['42', '10.5', '8.5', '8', '26.5'],
            ['43', '11', '9.5', '9', '27.5'],
            ['44', '12', '10', '9.5', '28.5'],
        ],
    },
};

const tips = [
    { icon: '📏', key: 'sizeGuideTip1' },
    { icon: '👗', key: 'sizeGuideTip2' },
    { icon: '🔄', key: 'sizeGuideTip3' },
];

const SizeGuideModal = ({ isOpen, onClose, category = 'women', selectedSize }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(
        category === 'Hombres' ? 'men' : category === 'Accesorios' ? 'shoes' : 'women'
    );
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';
        modalRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    const data = sizeData[activeTab];
    const tabs = [
        { key: 'women', label: t('women') },
        { key: 'men', label: t('men') },
        { key: 'shoes', label: t('megaShoes') },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div
                        ref={modalRef}
                        tabIndex={-1}
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-warm-50 dark:bg-gray-900 shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('sizeGuide')}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-warm-50 dark:bg-gray-900 border-b border-warm-300 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Ruler className="w-5 h-5 text-accent-900 dark:text-white" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('sizeGuide')}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-warm-300 dark:hover:bg-gray-800 transition-colors"
                                aria-label={t('close')}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Tabs */}
                            <div className="flex gap-1 p-1 bg-warm-300 dark:bg-gray-800">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                                            activeTab === tab.key
                                                ? 'bg-warm-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto border border-warm-400 dark:border-gray-700">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-warm-200 dark:bg-gray-800">
                                            {data.headers.map((h, i) => (
                                                <th key={i} className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.rows.map((row, rIdx) => {
                                            const isSelected = selectedSize === row[0];
                                            return (
                                                <tr
                                                    key={rIdx}
                                                    className={`border-t border-warm-300 dark:border-gray-800 transition-colors ${
                                                        isSelected
                                                            ? 'bg-accent-900/5 dark:bg-white/5'
                                                            : 'hover:bg-warm-200 dark:hover:bg-gray-800/50'
                                                    }`}
                                                >
                                                    {row.map((cell, cIdx) => (
                                                        <td
                                                            key={cIdx}
                                                            className={`px-4 py-3 whitespace-nowrap ${
                                                                cIdx === 0 ? 'font-semibold' : 'text-gray-600 dark:text-gray-400'
                                                            } ${isSelected && cIdx === 0 ? 'text-accent-900 dark:text-white' : ''}`}
                                                        >
                                                            {cIdx === 0 && isSelected && (
                                                                <span className="inline-block w-2 h-2 bg-accent-900 dark:bg-white rounded-full mr-2" />
                                                            )}
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tips */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('sizeGuideTips')}</h3>
                                {tips.map((tip, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="text-lg">{tip.icon}</span>
                                        <p>{t(tip.key)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SizeGuideModal;
