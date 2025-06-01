import { isAfter, isBefore, subDays } from 'date-fns';

// Validate location input
export const validateLocation = (location) => {
  const errors = [];
  
  if (!location || typeof location !== 'string') {
    errors.push('Location is required');
    return { isValid: false, errors };
  }
  
  const trimmedLocation = location.trim();
  
  if (trimmedLocation.length === 0) {
    errors.push('Location cannot be empty');
  } else if (trimmedLocation.length > 100) {
    errors.push('Location name is too long (max 100 characters)');
  } else if (!/^[a-zA-Z0-9\s,.-]+$/.test(trimmedLocation)) {
    errors.push('Location contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    value: trimmedLocation
  };
};

// Validate date range
export const validateDateRange = (startDate, endDate) => {
  const errors = [];
  const today = new Date();
  const fiveDaysAgo = subDays(today, 5);
  
  if (!startDate) {
    errors.push('Start date is required');
  } else {
    const start = new Date(startDate);
    
    if (isNaN(start.getTime())) {
      errors.push('Start date is invalid');
    } else {
      if (isBefore(start, fiveDaysAgo)) {
        errors.push('Start date cannot be more than 5 days in the past');
      } else if (isAfter(start, today)) {
        errors.push('Start date cannot be in the future');
      }
    }
  }
  
  if (!endDate) {
    errors.push('End date is required');
  } else {
    const end = new Date(endDate);
    
    if (isNaN(end.getTime())) {
      errors.push('End date is invalid');
    } else {
      if (isAfter(end, today)) {
        errors.push('End date cannot be in the future');
      }
      
      if (startDate && !errors.some(e => e.includes('Start date'))) {
        const start = new Date(startDate);
        if (isAfter(start, end)) {
          errors.push('End date must be after start date');
        } else {
          // Check if date range is not too long (more than 7 days)
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 7) {
            errors.push('Date range cannot be more than 7 days');
          }
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate weather data for saving
export const validateWeatherData = (data) => {
  const errors = [];
  
  // Validate location
  const locationValidation = validateLocation(data.location);
  if (!locationValidation.isValid) {
    errors.push(...locationValidation.errors);
  }
  
  // Validate date range
  const dateValidation = validateDateRange(data.startDate, data.endDate);
  if (!dateValidation.isValid) {
    errors.push(...dateValidation.errors);
  }
  
  // Validate boolean flags
  if (data.includeYouTube !== undefined && typeof data.includeYouTube !== 'boolean') {
    errors.push('includeYouTube must be a boolean value');
  }
  
  if (data.includeMaps !== undefined && typeof data.includeMaps !== 'boolean') {
    errors.push('includeMaps must be a boolean value');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate coordinates
export const validateCoordinates = (lat, lon) => {
  const errors = [];
  
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  
  if (isNaN(latitude)) {
    errors.push('Latitude must be a valid number');
  } else if (latitude < -90 || latitude > 90) {
    errors.push('Latitude must be between -90 and 90');
  }
  
  if (isNaN(longitude)) {
    errors.push('Longitude must be a valid number');
  } else if (longitude < -180 || longitude > 180) {
    errors.push('Longitude must be between -180 and 180');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    coordinates: errors.length === 0 ? { lat: latitude, lon: longitude } : null
  };
};

// Validate email format (for future use)
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || typeof email !== 'string') {
    return { isValid: false, errors: ['Email is required'] };
  }
  
  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return { isValid: false, errors: ['Email cannot be empty'] };
  }
  
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, errors: ['Email format is invalid'] };
  }
  
  return { isValid: true, errors: [], value: trimmedEmail };
};

// Validate export format
export const validateExportFormat = (format) => {
  const validFormats = ['json', 'csv', 'markdown', 'md'];
  
  if (!format || typeof format !== 'string') {
    return { isValid: false, errors: ['Export format is required'] };
  }
  
  const lowerFormat = format.toLowerCase();
  
  if (!validFormats.includes(lowerFormat)) {
    return { 
      isValid: false, 
      errors: [`Invalid export format. Must be one of: ${validFormats.join(', ')}`] 
    };
  }
  
  return { isValid: true, errors: [], value: lowerFormat };
};

// General form validation helper
export const validateForm = (fields, validationRules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(validationRules).forEach(fieldName => {
    const value = fields[fieldName];
    const rules = validationRules[fieldName];
    const fieldErrors = [];
    
    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim().length === 0))) {
      fieldErrors.push(`${fieldName} is required`);
    }
    
    // Only validate other rules if field has a value
    if (value && typeof value === 'string' && value.trim().length > 0) {
      const trimmedValue = value.trim();
      
      // Min length validation
      if (rules.minLength && trimmedValue.length < rules.minLength) {
        fieldErrors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
      }
      
      // Max length validation
      if (rules.maxLength && trimmedValue.length > rules.maxLength) {
        fieldErrors.push(`${fieldName} must be less than ${rules.maxLength} characters long`);
      }
      
      // Pattern validation
      if (rules.pattern && !rules.pattern.test(trimmedValue)) {
        fieldErrors.push(rules.patternMessage || `${fieldName} format is invalid`);
      }
      
      // Custom validation
      if (rules.custom && typeof rules.custom === 'function') {
        const customResult = rules.custom(trimmedValue);
        if (!customResult.isValid) {
          fieldErrors.push(...customResult.errors);
        }
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
      isValid = false;
    }
  });
  
  return { isValid, errors };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Format validation errors for display
export const formatValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    return errors.join(', ');
  }
  
  if (typeof errors === 'object') {
    const allErrors = [];
    Object.keys(errors).forEach(field => {
      if (Array.isArray(errors[field])) {
        allErrors.push(...errors[field]);
      } else {
        allErrors.push(errors[field]);
      }
    });
    return allErrors.join(', ');
  }
  
  return errors.toString();
};
