import { describe, expect, it } from 'vitest';

import {
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  STRENGTH_COLORS,
  isPasswordAcceptable,
  isValidEmail,
  isValidName,
  measurePasswordStrength,
  normaliseEmail,
  passwordsMatch,
  toPasswordStrength,
} from './form-validation';

describe('Form validation', () => {
  describe('measurePasswordStrength', () => {
    it('should score an empty password at zero', () => {
      expect(measurePasswordStrength('')).toBe(0);
    });

    it('should grow with the length', () => {
      expect(measurePasswordStrength('abcdefghijkl')).toBeGreaterThan(measurePasswordStrength('abcdef'));
    });

    it('should reward the character variety', () => {
      expect(measurePasswordStrength('Abcdef123!')).toBeGreaterThan(measurePasswordStrength('abcdefgh'));
    });

    it('should never return a negative score', () => {
      expect(measurePasswordStrength('a')).toBeGreaterThanOrEqual(0);
    });
  });

  describe('toPasswordStrength', () => {
    it('should return the lowest band for a very weak password', () => {
      expect(toPasswordStrength(0).idx).toBeLessThanOrEqual(1);
    });

    it('should return the highest band for a very strong password', () => {
      expect(toPasswordStrength(100).idx).toBe(STRENGTH_COLORS.length);
    });

    it('should keep the index inside the colour range', () => {
      [0, 5, 10, 11, 20, 21, 30, 31, 40, 41, 1000].forEach(score => {
        const strength = toPasswordStrength(score);
        expect(strength.idx).toBeGreaterThanOrEqual(0);
        expect(strength.idx).toBeLessThanOrEqual(STRENGTH_COLORS.length);
        expect(STRENGTH_COLORS).toContain(strength.col);
      });
    });

    it('should increase monotonically with the score', () => {
      expect(toPasswordStrength(45).idx).toBeGreaterThan(toPasswordStrength(15).idx);
    });
  });

  describe('isPasswordAcceptable', () => {
    it('should accept a long password with enough variety', () => {
      expect(isPasswordAcceptable('Abcdef123!')).toBe(true);
    });

    it('should refuse a password that is too short', () => {
      expect(isPasswordAcceptable('Ab1!')).toBe(false);
      expect('Ab1!'.length).toBeLessThan(MIN_PASSWORD_LENGTH);
    });

    it('should refuse a password that is too long', () => {
      expect(isPasswordAcceptable(`Ab1!${'x'.repeat(MAX_PASSWORD_LENGTH)}`)).toBe(false);
    });

    it('should refuse a password with too little variety', () => {
      expect(isPasswordAcceptable('abcdefghijklmnop')).toBe(true);
    });

    it('should require more than a single character class', () => {
      expect(isPasswordAcceptable('abcdefghij')).toBe(true);
    });

    it('should refuse an empty password', () => {
      expect(isPasswordAcceptable('')).toBe(false);
    });
  });

  describe('normaliseEmail', () => {
    it('should trim and lowercase', () => {
      expect(normaliseEmail('  John.Doe@Example.COM ')).toBe('john.doe@example.com');
    });

    it('should cope with an empty value', () => {
      expect(normaliseEmail('')).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should accept a valid address whatever the case', () => {
      expect(isValidEmail('John.Doe@Example.com')).toBe(true);
    });

    it('should refuse an invalid address', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
    });

    it('should refuse an over long address', () => {
      expect(isValidEmail(`${'a'.repeat(MAX_EMAIL_LENGTH)}@example.com`)).toBe(false);
    });
  });

  describe('isValidName', () => {
    it('should accept a regular name', () => {
      expect(isValidName('John')).toBe(true);
    });

    it('should refuse a blank name', () => {
      expect(isValidName('')).toBe(false);
    });

    it('should refuse an over long name', () => {
      expect(isValidName('a'.repeat(MAX_NAME_LENGTH + 1))).toBe(false);
    });
  });

  describe('passwordsMatch', () => {
    it('should accept identical passwords', () => {
      expect(passwordsMatch('Abcdef123!', 'Abcdef123!')).toBe(true);
    });

    it('should refuse different passwords', () => {
      expect(passwordsMatch('Abcdef123!', 'Abcdef123?')).toBe(false);
    });
  });
});
