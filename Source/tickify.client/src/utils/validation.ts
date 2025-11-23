/**
 * Validation utilities for form inputs
 */

// Email validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || email.trim() === "") {
    return { isValid: false, error: "Email là bắt buộc" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Email không đúng định dạng" };
  }

  if (email.length > 100) {
    return { isValid: false, error: "Email không được dài quá 100 ký tự" };
  }

  return { isValid: true };
};

// Vietnamese phone number validation
export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || phone.trim() === "") {
    return { isValid: false, error: "Số điện thoại là bắt buộc" };
  }

  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, "");

  // Vietnamese phone number patterns:
  // - 10 digits starting with 0: 0xxxxxxxxx
  // - 11 digits starting with +84: +84xxxxxxxxx
  // - 9 digits starting with 84: 84xxxxxxxxx
  const phoneRegex = /^(\+84|0|84)[0-9]{9,10}$/;
  
  if (!phoneRegex.test(cleaned)) {
    return { 
      isValid: false, 
      error: "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 chữ số)" 
    };
  }

  return { isValid: true };
};

// Name validation
export const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim() === "") {
    return { isValid: false, error: "Họ tên là bắt buộc" };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { isValid: false, error: "Họ tên phải có ít nhất 2 ký tự" };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: "Họ tên không được dài quá 100 ký tự" };
  }

  // Check for valid name characters (allow Vietnamese characters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: "Họ tên chỉ được chứa chữ cái, khoảng trắng, dấu gạch ngang và dấu nháy đơn" };
  }

  return { isValid: true };
};

// MoMo phone validation
export const validateMomoPhone = (phone: string): { isValid: boolean; error?: string } => {
  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.isValid) {
    return phoneValidation;
  }

  // Additional check: MoMo phone should be 10 digits starting with 0
  const cleaned = phone.replace(/[\s-]/g, "");
  if (!cleaned.startsWith("0") || cleaned.length !== 10) {
    return { 
      isValid: false, 
      error: "Số điện thoại MoMo phải là 10 chữ số và bắt đầu bằng 0" 
    };
  }

  return { isValid: true };
};

// Credit card number validation (Luhn algorithm)
export const validateCardNumber = (cardNumber: string): { isValid: boolean; error?: string } => {
  if (!cardNumber || cardNumber.trim() === "") {
    return { isValid: false, error: "Số thẻ là bắt buộc" };
  }

  // Remove spaces
  const cleaned = cardNumber.replace(/\s/g, "");

  // Check if it's all digits
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: "Số thẻ chỉ được chứa chữ số" };
  }

  // Check length (13-19 digits for most cards)
  if (cleaned.length < 13 || cleaned.length > 19) {
    return { isValid: false, error: "Số thẻ phải có từ 13 đến 19 chữ số" };
  }

  // Luhn algorithm validation
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return { isValid: false, error: "Số thẻ không hợp lệ (kiểm tra Luhn)" };
  }

  return { isValid: true };
};

// Card expiry date validation (MM/YY format)
export const validateCardExpiry = (expiry: string): { isValid: boolean; error?: string } => {
  if (!expiry || expiry.trim() === "") {
    return { isValid: false, error: "Ngày hết hạn là bắt buộc" };
  }

  const expiryRegex = /^(\d{2})\/(\d{2})$/;
  const match = expiry.match(expiryRegex);

  if (!match) {
    return { isValid: false, error: "Định dạng ngày hết hạn không đúng (MM/YY)" };
  }

  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);

  if (month < 1 || month > 12) {
    return { isValid: false, error: "Tháng phải từ 01 đến 12" };
  }

  // Convert YY to full year (assuming 20YY for years 00-99)
  const fullYear = 2000 + year;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
    return { isValid: false, error: "Thẻ đã hết hạn" };
  }

  return { isValid: true };
};

// CVV validation
export const validateCVV = (cvv: string): { isValid: boolean; error?: string } => {
  if (!cvv || cvv.trim() === "") {
    return { isValid: false, error: "CVV là bắt buộc" };
  }

  if (!/^\d+$/.test(cvv)) {
    return { isValid: false, error: "CVV chỉ được chứa chữ số" };
  }

  if (cvv.length !== 3 && cvv.length !== 4) {
    return { isValid: false, error: "CVV phải có 3 hoặc 4 chữ số" };
  }

  return { isValid: true };
};

// Cardholder name validation
export const validateCardholderName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim() === "") {
    return { isValid: false, error: "Tên chủ thẻ là bắt buộc" };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { isValid: false, error: "Tên chủ thẻ phải có ít nhất 2 ký tự" };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: "Tên chủ thẻ không được dài quá 50 ký tự" };
  }

  // Cardholder names typically contain letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: "Tên chủ thẻ chỉ được chứa chữ cái, khoảng trắng, dấu gạch ngang và dấu nháy đơn" };
  }

  return { isValid: true };
};

// Format card number with spaces (XXXX XXXX XXXX XXXX)
export const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\s/g, "");
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(" ") : cleaned;
};

// Format phone number (0XXX XXX XXX)
export const formatPhoneNumber = (value: string): string => {
  if (!value) return "";
  
  // Remove all non-digit characters except +
  const cleaned = value.replace(/[^\d+]/g, "");
  
  // Handle +84 format
  if (cleaned.startsWith("+84")) {
    const digits = cleaned.slice(3);
    if (digits.length <= 3) {
      return `+84 ${digits}`;
    } else if (digits.length <= 6) {
      return `+84 ${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else {
      return `+84 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    }
  }
  
  // Handle 84 format (without +)
  if (cleaned.startsWith("84") && cleaned.length >= 10) {
    const digits = cleaned.slice(2);
    if (digits.length <= 3) {
      return `0${digits}`;
    } else if (digits.length <= 6) {
      return `0${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else {
      return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    }
  }
  
  // Handle 0 format (most common for Vietnamese phones)
  if (cleaned.startsWith("0")) {
    const digits = cleaned;
    if (digits.length <= 4) {
      return digits;
    } else if (digits.length <= 7) {
      return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    } else {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
    }
  }
  
  // If doesn't start with 0, 84, or +84, just return cleaned (might be incomplete input)
  return cleaned;
};

// Format expiry date (MM/YY)
export const formatExpiryDate = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
};

