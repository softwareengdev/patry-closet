import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import QuickViewModal from './QuickViewModal';
import { mockProducts } from './ProductsPage';

const FeaturedProducts = () => {
    const { t } = useTranslation();
    const [quickViewProduct, setQuickViewProduct] = useState(null);

    const featured = mockProducts
        .filter(p => p.badge === 'bestSeller' || p.badge === 'new')
        .slice(0, 8);

    return (
        <section className="py-20 sm:py-28 bg-warm-100 dark:bg-gray-950 w-full">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
                {/* Section header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12 sm:mb-16">
                    <div>
                        <span className="text-[11px] font-medium uppercase tracking-ultra-wide text-gray-400 mb-3 block">
                            {t('curatedSelection')}
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light tracking-tight text-gray-900 dark:text-white">
                            {t('featuredProducts')}
                        </h2>
                    </div>
                    <Link
                        to="/products"
                        className="group flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                        {t('viewAll')}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                    {featured.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onQuickView={setQuickViewProduct}
                        />
                    ))}
                </div>
            </div>

            <QuickViewModal
                product={quickViewProduct}
                isOpen={!!quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
            />
        </section>
    );
};

export default FeaturedProducts;