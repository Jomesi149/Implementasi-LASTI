import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email'),
  username: z.string().min(3, 'Min 3 characters').max(50, 'Max 50 characters'),
  password: z.string().min(8, 'Min 8 characters'),
  channel: z.enum(['email', 'sms', 'auth_app']),
  phoneNumber: z.string().optional(),
});

export const otpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Code must be 6 digits'),
});
