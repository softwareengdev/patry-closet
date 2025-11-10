import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Mock para artículos de blog (extiende con API real)
const mockBlogPosts = [
    {
        id: 1,
        title: 'Tendencias de Moda 2025: Estilos Innovadores y Elegantes para un Guardarropa Único',
        date: 'Noviembre 10, 2025',
        author: 'Equipo de Estilismo Patry Closet',
        content: `
            <p>El 2025 trae una explosión de creatividad en la moda, fusionando lo clásico con lo innovador. Inspirados en figuras famosas como Zendaya y Timothée Chalamet, que combinan elegancia atemporal con toques futuristas, exploramos tendencias que elevan tu estilismo a niveles únicos. Desde siluetas oversize hasta encajes delicados, descubre cómo incorporar estos estilos en tu guardarropa diario.</p>
            
            <h2>1. Boho Chic Reinventado: Libertad y Elegancia</h2>
            <img src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80" alt="Boho Chic 2025" className="w-full h-64 object-cover rounded-lg mb-4" />
            <p>El Boho Chic evoluciona en 2025 hacia una versión más refinada, incorporando telas sostenibles como algodón orgánico y lino reciclado. Famosas como Florence Pugh lo llevan con maxi vestidos fluidos y accesorios artesanales. Tip: Combina un vestido boho con botas de cuero para un look urbano-innovador.</p>
            
            <h2>2. Siluetas Oversize: Comodidad con Estilo</h2>
            <img src="https://images.unsplash.com/photo-1520974735194-8d95cdf6d2ef?auto=format&fit=crop&w=800&q=80" alt="Siluetas Oversize 2025" className="w-full h-64 object-cover rounded-lg mb-4" />
            <p>Inspirado en diseñadores como Balenciaga, las prendas oversize dominan con blazers anchos y pantalones bombacho. Celebridades como Harry Styles los usan para desafiar normas de género. Estilismo: Equilibra con accesorios minimalistas para un toque elegante y moderno.</p>
            
            <h2>3. Encajes y Transparencias: Sensualidad Elegante</h2>
            <img src="https://images.unsplash.com/photo-1594633312681-86309903deb9?auto=format&fit=crop&w=800&q=80" alt="Encajes 2025" className="w-full h-64 object-cover rounded-lg mb-4" />
            <p>Los encajes delicados y transparencias sutiles, vistos en pasarelas de Chanel, agregan misterio. Famosas como Rihanna los integran en looks cotidianos. Consejo: Layering con básicos sólidos para un estilismo versátil y sofisticado.</p>
            
            <h2>4. Lentejuelas y Brillantes: Glamour Diario</h2>
            <img src="https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80" alt="Lentejuelas 2025" className="w-full h-64 object-cover rounded-lg mb-4" />
            <p>No solo para noches: lentejuelas en tonos mocha mousse (el color del año) se usan en prendas diurnas, como faldas o tops. Influencers como Emma Chamberlain lo combinan con denim para un contraste innovador.</p>
            
            <h2>5. Polka Dots y Estampados Geométricos: Retro Moderno</h2>
            <img src="https://images.unsplash.com/photo-1529139574466-a303d20ff24f?auto=format&fit=crop&w=800&q=80" alt="Polka Dots 2025" className="w-full h-64 object-cover rounded-lg mb-4" />
            <p>Los polka dots regresan en versiones oversized, fusionados con formas geométricas. Diseñadores como Louis Vuitton los elevan con tejidos high-tech. Estilo famoso: Como en los looks de Zendaya, mezcla con neutros para elegancia.</p>
            
            <p>En Patry Closet, incorporamos estas tendencias en colecciones sostenibles. ¡Explora y crea tu estilismo único!</p>
        `,
        images: [
            'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1520974735194-8d95cdf6d2ef?auto=format&fit=crop&w=800&q=80',
            // Agrega más
        ]
    },
    // Agrega más posts si necesitas
];

const Blog = () => {
    const { t } = useTranslation();

    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200">{t('ourBlog')}</h1>
                <div className="space-y-16">
                    {mockBlogPosts.map(post => (
                        <motion.article
                            key={post.id}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl"
                        >
                            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{post.title}</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">{post.date} | {post.author}</p>
                            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Blog;