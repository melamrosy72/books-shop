// src/features/auth/validators/auth.validator.ts
import { email, z } from 'zod';

export const registerSchema = z.object({
    email: z.email('Invalid email address').nonempty('Email is Required').max(100, 'email must be maximum 100 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters').nonempty('Username is Required').max(30, 'Username must be maximum 30 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters').nonempty('Password is Required'),
});

export const loginSchema = z.object({
    login: z.string("username or email is required").max(100).min(1, "username or email is required"),
    password: z.string('password is required ').max(255).min(1, "password is required"),
});

export const updateProfileSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    email: z.email('Invalid email address').optional(),
});

export const forgetPasswordSchema = z.object({
    email: z.email('Invalid email address').nonempty('Email is Required').max(100, 'email must be maximum 100 characters'),
})

export const resetPasswordSchema = z.object({
    email: z.email('Invalid email address').nonempty('Email is Required').max(100, 'email must be maximum 100 characters'),
    otp: z.string().length(6, 'OTP must be 6 characters length').nonempty('OTP is Required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters').nonempty('Password is Required'),
    confirmPassword: z.string().min(6, { message: 'Confirm password must be at least 6 characters' }).nonempty('Password is Required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type resetPasswordInput = z.infer<typeof resetPasswordSchema>;