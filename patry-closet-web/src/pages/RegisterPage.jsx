import { useContext } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
    const { isDark } = useContext(ThemeContext);

    return (
        <div className="min-h-screen flex">
            {/* Left: Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    <RegisterForm />
                </motion.div>
            </div>

            {/* Right: Fashion Image (desktop only) */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 to-black/40 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80"
                    alt="Fashion collection"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute bottom-12 left-12 z-20 text-white max-w-md">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <p className="text-sm font-medium tracking-widest uppercase mb-3 text-white/80">
                            Join the Community
                        </p>
                        <h2 className="text-4xl font-serif leading-tight mb-4">
                            Discover your signature style
                        </h2>
                        <p className="text-white/70 text-sm leading-relaxed">
                            Create an account to save your favorites, get personalized picks, and enjoy exclusive member perks.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
