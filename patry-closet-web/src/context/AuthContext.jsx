import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import authService from '../lib/authService';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
    ACCESS: 'patry_access_token',
    REFRESH: 'patry_refresh_token',
};

/**
 * AuthProvider — manages authentication state across the app.
 * Features:
 *   - JWT-based auth (mock service, ready for real backend)
 *   - Auto token refresh every 12 minutes
 *   - Login / Register / Social login / Logout
 *   - Profile management (CRUD)
 *   - Smart redirect after login
 *   - Cart & Wishlist merge on login
 *   - Session management
 *   - Listens for forced logout events (401 from api interceptor)
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const refreshTimerRef = useRef(null);

    const isAuthenticated = !!user;

    /* ─── Token helpers ─── */
    const storeTokens = useCallback((tokens) => {
        localStorage.setItem(STORAGE_KEYS.ACCESS, tokens.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH, tokens.refreshToken);
    }, []);

    const clearTokens = useCallback(() => {
        localStorage.removeItem(STORAGE_KEYS.ACCESS);
        localStorage.removeItem(STORAGE_KEYS.REFRESH);
    }, []);

    const hasStoredTokens = useCallback(() => {
        return !!localStorage.getItem(STORAGE_KEYS.ACCESS);
    }, []);

    /* ─── Auto refresh token every 12 min ─── */
    const scheduleRefresh = useCallback(() => {
        if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = setInterval(async () => {
            try {
                const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH);
                if (!refreshToken) return;
                const tokens = await authService.refreshToken(refreshToken);
                storeTokens(tokens);
            } catch {
                // Refresh failed — force logout
                setUser(null);
                clearTokens();
            }
        }, 12 * 60 * 1000);
    }, [storeTokens, clearTokens]);

    const stopRefresh = useCallback(() => {
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    /* ─── Initialize: check existing token on mount ─── */
    useEffect(() => {
        const initAuth = async () => {
            if (!hasStoredTokens()) {
                setIsLoading(false);
                return;
            }
            try {
                const profile = await authService.getProfile();
                setUser(profile);
                scheduleRefresh();
            } catch {
                clearTokens();
            } finally {
                setIsLoading(false);
            }
        };
        initAuth();

        // Listen for forced logout from API interceptor
        const handleForceLogout = () => {
            setUser(null);
            clearTokens();
            stopRefresh();
        };
        window.addEventListener('auth:logout', handleForceLogout);
        return () => {
            window.removeEventListener('auth:logout', handleForceLogout);
            stopRefresh();
        };
    }, [hasStoredTokens, clearTokens, scheduleRefresh, stopRefresh]);

    /* ─── Login ─── */
    const login = useCallback(async (credentials) => {
        setError(null);
        try {
            const { user: userData, tokens } = await authService.login(credentials);
            storeTokens(tokens);
            setUser(userData);
            scheduleRefresh();
            // Notify cart & wishlist contexts to merge server data
            window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: userData } }));
            return userData;
        } catch (err) {
            const msg = err?.response?.data?.message || 'Login failed. Please try again.';
            setError(msg);
            throw err;
        }
    }, [storeTokens, scheduleRefresh]);

    /* ─── Register ─── */
    const register = useCallback(async (data) => {
        setError(null);
        try {
            const { user: userData, tokens } = await authService.register(data);
            storeTokens(tokens);
            setUser(userData);
            scheduleRefresh();
            window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: userData } }));
            return userData;
        } catch (err) {
            const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
            setError(msg);
            throw err;
        }
    }, [storeTokens, scheduleRefresh]);

    /* ─── Social Login ─── */
    const socialLogin = useCallback(async (provider) => {
        setError(null);
        try {
            const { user: userData, tokens } = await authService.socialLogin(provider);
            storeTokens(tokens);
            setUser(userData);
            scheduleRefresh();
            window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: userData } }));
            return userData;
        } catch (err) {
            const msg = err?.response?.data?.message || `${provider} login failed.`;
            setError(msg);
            throw err;
        }
    }, [storeTokens, scheduleRefresh]);

    /* ─── Logout ─── */
    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch { /* ignore */ }
        setUser(null);
        clearTokens();
        stopRefresh();
        setError(null);
        // Notify cart & wishlist contexts to handle cleanup
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }, [clearTokens, stopRefresh]);

    /* ─── Logout from all devices ─── */
    const logoutAllDevices = useCallback(async () => {
        try {
            await authService.logoutAllDevices();
        } catch { /* ignore */ }
        setUser(null);
        clearTokens();
        stopRefresh();
        setError(null);
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }, [clearTokens, stopRefresh]);

    /* ─── Profile update ─── */
    const updateProfile = useCallback(async (updates) => {
        const updated = await authService.updateProfile(updates);
        setUser((prev) => ({ ...prev, ...updated }));
        return updated;
    }, []);

    /* ─── Avatar upload ─── */
    const uploadAvatar = useCallback(async (file) => {
        const { avatar } = await authService.uploadAvatar(file);
        setUser((prev) => ({ ...prev, avatar }));
        return avatar;
    }, []);

    /* ─── Password reset flow ─── */
    const forgotPassword = useCallback(async (email) => {
        return authService.forgotPassword(email);
    }, []);

    const resetPassword = useCallback(async (token, newPassword) => {
        return authService.resetPassword(token, newPassword);
    }, []);

    /* ─── Email verification ─── */
    const verifyEmail = useCallback(async (token) => {
        const result = await authService.verifyEmail(token);
        if (result.verified) {
            setUser((prev) => prev ? { ...prev, emailVerified: true } : prev);
        }
        return result;
    }, []);

    const resendVerification = useCallback(async (email) => {
        return authService.resendVerification(email || user?.email);
    }, [user]);

    /* ─── Address management ─── */
    const updateAddresses = useCallback(async (addresses) => {
        const updated = await authService.updateAddresses(addresses);
        setUser((prev) => ({ ...prev, addresses: updated }));
        return updated;
    }, []);

    /* ─── Preferences ─── */
    const updatePreferences = useCallback(async (preferences) => {
        const updated = await authService.updatePreferences(preferences);
        setUser((prev) => ({
            ...prev,
            preferences: { ...prev.preferences, ...updated },
        }));
        return updated;
    }, []);

    /* ─── Clear error ─── */
    const clearError = useCallback(() => setError(null), []);

    const value = {
        // State
        user,
        isAuthenticated,
        isLoading,
        error,

        // Auth actions
        login,
        register,
        socialLogin,
        logout,
        logoutAllDevices,

        // Profile
        updateProfile,
        uploadAvatar,
        updateAddresses,
        updatePreferences,

        // Password
        forgotPassword,
        resetPassword,

        // Email
        verifyEmail,
        resendVerification,

        // Utilities
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Custom hook with error boundary
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
