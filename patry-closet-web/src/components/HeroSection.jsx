import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom'; // Agregado para link
import { useTranslation } from 'react-i18next'; // Para i18n

const HeroSection = () => {
    const { t } = useTranslation();
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], [0, 50]); // Parallax en h1

    return (
        <div className="relative w-full h-screen bg-cover bg-center overflow-hidden" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80')" }}>
            <div className="absolute inset-0 bg-black opacity-40"></div>
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
                <motion.h1
                    style={{ y }}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="text-6xl font-extrabold mb-4 tracking-wide"
                >
                    {t('discoverFashion')}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="text-2xl mb-8"
                >
                    {t('innovativeCollections')}
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                >
                    <Link to="/blog" className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition duration-300" aria-label={t('exploreNow')}>
                        {t('exploreNow')}
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroSection;