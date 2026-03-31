import { z } from 'zod';

/* ─── Login ─── */
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters'),
    rememberMe: z.boolean().optional().default(false),
});

/* ─── Registration ─── */
export const registerSchema = z
    .object({
        firstName: z
            .string()
            .min(1, 'First name is required')
            .min(2, 'First name must be at least 2 characters')
            .max(50, 'First name must be less than 50 characters')
            .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name contains invalid characters'),
        lastName: z
            .string()
            .min(1, 'Last name is required')
            .min(2, 'Last name must be at least 2 characters')
            .max(50, 'Last name must be less than 50 characters')
            .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name contains invalid characters'),
        email: z
            .string()
            .min(1, 'Email is required')
            .email('Please enter a valid email address'),
        password: z
            .string()
            .min(1, 'Password is required')
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
        dateOfBirth: z.string().optional(),
        gender: z.enum(['female', 'male', 'non-binary', 'prefer-not-to-say']).optional(),
        acceptTerms: z.literal(true, {
            errorMap: () => ({ message: 'You must accept the terms and privacy policy' }),
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

/* ─── Forgot Password ─── */
export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
});

/* ─── Reset Password ─── */
export const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

/* ─── Profile Update ─── */
export const profileSchema = z.object({
    firstName: z
        .string()
        .min(2, 'First name must be at least 2 characters')
        .max(50),
    lastName: z
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50),
    email: z.string().email('Please enter a valid email address'),
    phone: z
        .string()
        .optional()
        .refine(
            (val) => !val || /^\+?[1-9]\d{6,14}$/.test(val.replace(/[\s-]/g, '')),
            'Please enter a valid phone number'
        ),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['female', 'male', 'non-binary', 'prefer-not-to-say']).optional(),
});

/* ─── Address ─── */
export const addressSchema = z.object({
    label: z.string().min(1, 'Label is required').max(30),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    street: z.string().min(1, 'Street address is required'),
    apartment: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State/Province is required'),
    postalCode: z
        .string()
        .min(1, 'Postal code is required')
        .regex(/^[A-Za-z0-9\s-]{3,10}$/, 'Please enter a valid postal code'),
    country: z.string().min(1, 'Country is required'),
    phone: z.string().optional(),
    isDefault: z.boolean().optional().default(false),
});

/* ─── Password strength helper ─── */
export const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 4) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
    if (score <= 5) return { score: 4, label: 'Strong', color: 'bg-green-500' };
    return { score: 5, label: 'Very Strong', color: 'bg-emerald-500' };
};
