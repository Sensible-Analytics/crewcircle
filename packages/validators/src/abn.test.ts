import { describe, it, expect } from 'vitest';
import { validateABN } from './abn';

describe('validateABN', () => {
  it('accepts 51 824 753 556 (Australian Broadcasting Corporation)', () => {
    expect(validateABN('51824753556')).toBe(true);
  });

  it('accepts ABN with spaces stripped', () => {
    expect(validateABN('51 824 753 556')).toBe(true);
  });

  it('rejects 12 345 678 901 (invalid checksum)', () => {
    expect(validateABN('12345678901')).toBe(false);
  });

  it('rejects 10-digit input', () => {
    expect(validateABN('1234567890')).toBe(false);
  });

  it('rejects 12-digit input', () => {
    expect(validateABN('123456789012')).toBe(false);
  });

  it('rejects letters', () => {
    expect(validateABN('ABCDE678901')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateABN('')).toBe(false);
  });

  it('rejects all zeros', () => {
    expect(validateABN('00000000000')).toBe(false);
  });
});
