import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

/**
 * ProtectedRoute — wrapper for authenticated-only routes.
 * Redirects to /login?redirect=<current_path> if not logged in.
 * Shows loading skeleton while auth state initializes.
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-black dark:border-t-white rounded-full animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                </motion.div>
            </div>
        );
    }

    if (!isAuthenticated) {
        const redirectPath = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
    }

    return children;
};

export default ProtectedRoute;
