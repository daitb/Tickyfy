import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePhone,
  validateName,
  validateMomoPhone,
  validateCardNumber,
  validateCardExpiry,
  validateCVV,
  validateCardholderName,
  formatCardNumber,
  formatPhoneNumber,
  formatExpiryDate,
} from '../../utils/validation';

describe('validation utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email là bắt buộc');
    });

    it('should reject invalid email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email không đúng định dạng');
    });

    it('should reject email longer than 100 characters', () => {
      const longEmail = 'a'.repeat(90) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email không được dài quá 100 ký tự');
    });
  });

  describe('validatePhone', () => {
    it('should validate Vietnamese phone starting with 0', () => {
      const result = validatePhone('0912345678');
      expect(result.isValid).toBe(true);
    });

    it('should validate Vietnamese phone with +84', () => {
      const result = validatePhone('+84912345678');
      expect(result.isValid).toBe(true);
    });

    it('should validate Vietnamese phone with spaces', () => {
      const result = validatePhone('0912 345 678');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty phone', () => {
      const result = validatePhone('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Số điện thoại là bắt buộc');
    });

    it('should reject invalid phone format', () => {
      const result = validatePhone('12345');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should validate correct name', () => {
      const result = validateName('Nguyễn Văn A');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty name', () => {
      const result = validateName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Họ tên là bắt buộc');
    });

    it('should reject name shorter than 2 characters', () => {
      const result = validateName('A');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Họ tên phải có ít nhất 2 ký tự');
    });

    it('should reject name longer than 100 characters', () => {
      const longName = 'A'.repeat(101);
      const result = validateName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Họ tên không được dài quá 100 ký tự');
    });
  });

  describe('validateMomoPhone', () => {
    it('should validate correct MoMo phone', () => {
      const result = validateMomoPhone('0912345678');
      expect(result.isValid).toBe(true);
    });

    it('should reject phone not starting with 0', () => {
      const result = validateMomoPhone('9123456789');
      expect(result.isValid).toBe(false);
      // validatePhone is called first and returns generic error for invalid format
      expect(result.error).toBe('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 chữ số)');
    });

    it('should reject phone with wrong length', () => {
      const result = validateMomoPhone('091234567');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCardNumber', () => {
    it('should validate correct card number (Luhn algorithm)', () => {
      // Valid test card number (Visa test number)
      const result = validateCardNumber('4111111111111111');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty card number', () => {
      const result = validateCardNumber('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Số thẻ là bắt buộc');
    });

    it('should reject card number with non-digits', () => {
      const result = validateCardNumber('4111-1111-1111-1111');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Số thẻ chỉ được chứa chữ số');
    });

    it('should reject card number with wrong length', () => {
      const result = validateCardNumber('123456789012');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Số thẻ phải có từ 13 đến 19 chữ số');
    });
  });

  describe('validateCardExpiry', () => {
    it('should validate future expiry date', () => {
      const futureYear = new Date().getFullYear() + 1;
      const yy = String(futureYear).slice(-2);
      const result = validateCardExpiry(`12/${yy}`);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty expiry', () => {
      const result = validateCardExpiry('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Ngày hết hạn là bắt buộc');
    });

    it('should reject invalid format', () => {
      const result = validateCardExpiry('12-25');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Định dạng ngày hết hạn không đúng (MM/YY)');
    });

    it('should reject expired card', () => {
      const result = validateCardExpiry('01/20');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Thẻ đã hết hạn');
    });
  });

  describe('validateCVV', () => {
    it('should validate 3-digit CVV', () => {
      const result = validateCVV('123');
      expect(result.isValid).toBe(true);
    });

    it('should validate 4-digit CVV', () => {
      const result = validateCVV('1234');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty CVV', () => {
      const result = validateCVV('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CVV là bắt buộc');
    });

    it('should reject CVV with wrong length', () => {
      const result = validateCVV('12');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CVV phải có 3 hoặc 4 chữ số');
    });
  });

  describe('formatCardNumber', () => {
    it('should format card number with spaces', () => {
      const result = formatCardNumber('4111111111111111');
      expect(result).toBe('4111 1111 1111 1111');
    });

    it('should handle already formatted number', () => {
      const result = formatCardNumber('4111 1111 1111 1111');
      expect(result).toBe('4111 1111 1111 1111');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format Vietnamese phone with 0', () => {
      const result = formatPhoneNumber('0912345678');
      expect(result).toBe('0912 345 678');
    });

    it('should format phone with +84', () => {
      const result = formatPhoneNumber('+84912345678');
      expect(result).toBe('+84 912 345 678');
    });
  });

  describe('formatExpiryDate', () => {
    it('should format expiry date as MM/YY', () => {
      const result = formatExpiryDate('1225');
      expect(result).toBe('12/25');
    });

    it('should handle partial input', () => {
      const result = formatExpiryDate('12');
      // formatExpiryDate adds / after 2 digits
      expect(result).toBe('12/');
    });
  });
});

