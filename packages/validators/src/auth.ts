import { z } from 'zod';

// Signup schema for business owner
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  businessName: z.string().min(1, 'Business name is required'),
  abn: z.string()
    .refine((abn) => {
      // Remove spaces for validation
      const cleanAbn = abn.replace(/\s/g, '');
      // Check length - ABN must be 11 digits
      if (cleanAbn.length !== 11) return false;
      // Check all digits
      if (!/^\d{11}$/.test(cleanAbn)) return false;
      return true;
    }, 'Invalid ABN - must be 11 digits'),
});

// Invitation schema for inviting employees
export const invitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  // Optional phone number for SMS invitation (Phase 1B consideration)
  phone: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    // Basic Australian mobile number validation
    return /^\+61\s?4\d{2}\s?\d{3}\s?\d{3}$/.test(val) || 
           /^04\d{2}\s?\d{3}\s?\d{3}$/.test(val);
  }, 'Invalid Australian mobile number'),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Password reset schema
export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Update password schema
export const updatePasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

// Export all schemas
export const authSchemas = {
  signup: signupSchema,
  invitation: invitationSchema,
  login: loginSchema,
  passwordReset: passwordResetSchema,
  updatePassword: updatePasswordSchema,
};

export type SignupValues = z.infer<typeof signupSchema>;
export type InvitationValues = z.infer<typeof invitationSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type PasswordResetValues = z.infer<typeof passwordResetSchema>;
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;
