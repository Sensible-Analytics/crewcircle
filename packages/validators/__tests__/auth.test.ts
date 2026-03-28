import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema, invitationSchema, passwordResetSchema, updatePasswordSchema } from '../src/auth';

describe('auth validation schemas', () => {
  describe('signupSchema', () => {
    // ABN 51824753556 is used in demo seed data - it passes format check but may fail checksum
    // The important thing is testing the schema accepts structurally valid ABNs
    it('validates correct signup data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        businessName: 'My Business',
        abn: '51824753556', // 11 digits, correct format
      };
      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'SecurePass123!',
        businessName: 'My Business',
        abn: '51824753556',
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects weak password (too short)', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Short1!',
        businessName: 'My Business',
        abn: '51824753556',
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects password without uppercase', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'securepass123!',
        businessName: 'My Business',
        abn: '51824753556',
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects password without lowercase', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SECUREPASS123!',
        businessName: 'My Business',
        abn: '51824753556',
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects password without number', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass!!!',
        businessName: 'My Business',
        abn: '51824753556',
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects password without special character', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        businessName: 'My Business',
        abn: '51824753556',
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects ABN that is too short', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        businessName: 'My Business',
        abn: '1234567890', // Only 10 digits
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects empty business name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        businessName: '',
        abn: '51824753556',
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anypassword',
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'anypassword',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('invitationSchema', () => {
    it('validates correct invitation data', () => {
      const validData = {
        email: 'employee@example.com',
      };
      const result = invitationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates Australian mobile number format', () => {
      const validData = {
        email: 'employee@example.com',
        phone: '0412 345 678',
      };
      const result = invitationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates +61 format', () => {
      const validData = {
        email: 'employee@example.com',
        phone: '+61 412 345 678',
      };
      const result = invitationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid phone format', () => {
      const invalidData = {
        email: 'employee@example.com',
        phone: '1234567890',
      };
      const result = invitationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('passwordResetSchema', () => {
    it('validates correct email', () => {
      const validData = {
        email: 'test@example.com',
      };
      const result = passwordResetSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
      };
      const result = passwordResetSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updatePasswordSchema', () => {
    it('validates correct password', () => {
      const validData = {
        password: 'NewSecure123!',
      };
      const result = updatePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects short password', () => {
      const invalidData = {
        password: 'Short1!',
      };
      const result = updatePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects password without special character', () => {
      const invalidData = {
        password: 'NewSecure123',
      };
      const result = updatePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
