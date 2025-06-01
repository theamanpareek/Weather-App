import Joi from 'joi';

// Schema for creating new weather entry
const weatherInputSchema = Joi.object({
  location: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Location is required',
      'string.min': 'Location must be at least 1 character long',
      'string.max': 'Location must be less than 100 characters',
      'any.required': 'Location is required'
    }),
  
  startDate: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format',
      'date.max': 'Start date cannot be in the future',
      'any.required': 'Start date is required'
    }),
  
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .max('now')
    .required()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date',
      'date.max': 'End date cannot be in the future',
      'any.required': 'End date is required'
    }),
  
  includeYouTube: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'includeYouTube must be a boolean value'
    }),
  
  includeMaps: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'includeMaps must be a boolean value'
    })
});

// Schema for updating weather entry
const updateInputSchema = Joi.object({
  location: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Location cannot be empty',
      'string.min': 'Location must be at least 1 character long',
      'string.max': 'Location must be less than 100 characters'
    }),
  
  startDate: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format',
      'date.max': 'Start date cannot be in the future'
    }),
  
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .max('now')
    .optional()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date',
      'date.max': 'End date cannot be in the future'
    }),
  
  includeYouTube: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'includeYouTube must be a boolean value'
    }),
  
  includeMaps: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'includeMaps must be a boolean value'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Middleware function to validate weather input
export const validateWeatherInput = (req, res, next) => {
  const { error, value } = weatherInputSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }

  // Additional custom validation
  const { startDate, endDate } = value;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  // Check if date range is not too far in the past (more than 5 days)
  const fiveDaysAgo = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000));
  if (start < fiveDaysAgo) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: [{
        field: 'startDate',
        message: 'Start date cannot be more than 5 days in the past'
      }]
    });
  }

  // Check if date range is not too long (more than 7 days)
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 7) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: [{
        field: 'dateRange',
        message: 'Date range cannot be more than 7 days'
      }]
    });
  }

  // Validate location format (basic check)
  const location = value.location.trim();
  if (!/^[a-zA-Z\s,.-]+$/.test(location)) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: [{
        field: 'location',
        message: 'Location contains invalid characters'
      }]
    });
  }

  req.body = value;
  next();
};

// Middleware function to validate update input
export const validateUpdateInput = (req, res, next) => {
  const { error, value } = updateInputSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }

  // Additional custom validation for updates
  if (value.startDate && value.endDate) {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    const now = new Date();
    
    // Check if date range is not too far in the past (more than 5 days)
    const fiveDaysAgo = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000));
    if (start < fiveDaysAgo) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [{
          field: 'startDate',
          message: 'Start date cannot be more than 5 days in the past'
        }]
      });
    }

    // Check if date range is not too long (more than 7 days)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [{
          field: 'dateRange',
          message: 'Date range cannot be more than 7 days'
        }]
      });
    }
  }

  // Validate location format if provided
  if (value.location) {
    const location = value.location.trim();
    if (!/^[a-zA-Z\s,.-]+$/.test(location)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [{
          field: 'location',
          message: 'Location contains invalid characters'
        }]
      });
    }
  }

  req.body = value;
  next();
};

// Middleware to validate MongoDB ObjectId
export const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      message: 'The provided ID is not a valid MongoDB ObjectId'
    });
  }
  
  next();
};
