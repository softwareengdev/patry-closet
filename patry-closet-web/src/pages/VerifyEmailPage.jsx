import { motion } from 'framer-motion';
import VerifyEmail from '../components/auth/VerifyEmail';

const VerifyEmailPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <VerifyEmail />
            </motion.div>
        </div>
    );
};

export default VerifyEmailPage;
