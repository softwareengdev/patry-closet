import ProductCard from './ProductCard';
import { mockProducts } from './ProductsPage';

const FeaturedProducts = ({ onQuickView = () => { } }) => {  // ← opcional
    return (
        <section className="py-20 bg-white dark:bg-gray-950 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-12">
                    <h2 className="text-5xl font-bold tracking-tighter">Productos Destacados</h2>
                    <a href="/products" className="text-blue-600 hover:underline font-medium flex items-center gap-2">
                        Ver todo <span className="text-xl">→</span>
                    </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {mockProducts.slice(0, 8).map(product => (
                        <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;