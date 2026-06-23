/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate phone number
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate zip code
 */
export const isValidZipCode = (zipCode) => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
};

/**
 * Validate URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate credit card number (Luhn algorithm)
 */
export const isValidCreditCard = (cardNumber) => {
  const sanitized = cardNumber.replace(/\s/g, '');
  let sum = 0;
  let isEven = false;
  
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized[i]);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

/**
 * Validate CVV
 */
export const isValidCVV = (cvv) => {
  return /^\d{3,4}$/.test(cvv);
};

/**
 * Validate expiry date (MM/YY)
 */
export const isValidExpiry = (expiry) => {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return false;
  const [month, year] = expiry.split('/');
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  
  if (parseInt(year) < currentYear) return false;
  if (parseInt(year) === currentYear && parseInt(month) < currentMonth) return false;
  return true;
};

/**
 * Sanitize input
 */
export const sanitize = (input) => {
  if (!input) return input;
  if (typeof input === 'string') {
    return input.replace(/[<>]/g, '').trim();
  }
  if (Array.isArray(input)) {
    return input.map(item => sanitize(item));
  }
  if (typeof input === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitize(value);
    }
    return sanitized;
  }
  return input;
};

/**
 * Validation rules for forms
 */
export const validationRules = {
  required: (message = 'This field is required') => ({
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return value !== null && Object.keys(value).length > 0;
      return value !== undefined && value !== null && value !== '';
    },
    message
  }),
  
  email: (message = 'Invalid email address') => ({
    validate: (value) => isValidEmail(value),
    message
  }),
  
  minLength: (length, message = `Must be at least ${length} characters`) => ({
    validate: (value) => value?.length >= length,
    message
  }),
  
  maxLength: (length, message = `Must not exceed ${length} characters`) => ({
    validate: (value) => value?.length <= length,
    message
  }),
  
  pattern: (regex, message = 'Invalid format') => ({
    validate: (value) => regex.test(value),
    message
  }),
  
  min: (min, message = `Must be greater than ${min}`) => ({
    validate: (value) => parseFloat(value) >= min,
    message
  }),
  
  max: (max, message = `Must be less than ${max}`) => ({
    validate: (value) => parseFloat(value) <= max,
    message
  })
};