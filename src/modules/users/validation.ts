
import { email, z } from 'zod';


export const updateProfileSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    email: z.email('Invalid email address').optional(),
}).refine((data) => data.username || data.email, {
    message: 'No Data Has Been Provided for Update',
    path: ['username', 'email'],
});

export const changePasswordSchema = z.object({
    oldPassword: z.string('Old Password is Required').min(6, 'Password must be at least 6 characters').nonempty('Old Password is Required'),
    newPassword: z.string('New Password is Required').min(6, 'Password must be at least 6 characters').nonempty('New Password is Required'),
    confirmPassword: z.string('Confirm Password is Required').min(6, { message: 'Confirm password must be at least 6 characters' }).nonempty('Confirm Password is Required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['newPassword', 'confirmPassword'],
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;