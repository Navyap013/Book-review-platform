const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validation rules for user registration
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  
  handleValidationErrors
];

// Validation rules for user login
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Validation rules for book creation
const validateBookCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('author')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Author must be between 1 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('genre')
    .isIn(['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Children', 'Poetry', 'Drama', 'Horror', 'Thriller', 'Adventure', 'Comedy', 'Philosophy', 'Religion', 'Science', 'Technology', 'Travel', 'Cooking', 'Art', 'Music', 'Sports', 'Education', 'Politics', 'Economics', 'Psychology', 'Sociology', 'Other'])
    .withMessage('Please select a valid genre'),
  
  body('publishedDate')
    .isISO8601()
    .withMessage('Please provide a valid publication date'),
  
  body('publisher')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Publisher must be less than 100 characters'),
  
  body('pageCount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page count must be a positive integer'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('isbn')
    .optional()
    .trim()
    .matches(/^(?:\d{10}|\d{13})$/)
    .withMessage('ISBN must be 10 or 13 digits'),
  
  handleValidationErrors
];

// Validation rules for book updates
const validateBookUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('author')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Author must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('genre')
    .optional()
    .isIn(['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Children', 'Poetry', 'Drama', 'Horror', 'Thriller', 'Adventure', 'Comedy', 'Philosophy', 'Religion', 'Science', 'Technology', 'Travel', 'Cooking', 'Art', 'Music', 'Sports', 'Education', 'Politics', 'Economics', 'Psychology', 'Sociology', 'Other'])
    .withMessage('Please select a valid genre'),
  
  body('publishedDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid publication date'),
  
  handleValidationErrors
];

// Validation rules for review creation
const validateReviewCreation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Review title must be between 1 and 200 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Review content must be between 10 and 5000 characters'),
  
  body('spoilerAlert')
    .optional()
    .isBoolean()
    .withMessage('Spoiler alert must be a boolean value'),
  
  body('readingStatus')
    .optional()
    .isIn(['Want to Read', 'Currently Reading', 'Read', 'DNF'])
    .withMessage('Please select a valid reading status'),
  
  body('format')
    .optional()
    .isIn(['Hardcover', 'Paperback', 'E-book', 'Audiobook', 'Other'])
    .withMessage('Please select a valid format'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  handleValidationErrors
];

// Validation rules for user profile updates
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  
  body('favoriteGenres')
    .optional()
    .isArray()
    .withMessage('Favorite genres must be an array'),
  
  body('favoriteGenres.*')
    .optional()
    .isIn(['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Business'])
    .withMessage('Please select valid genres'),
  
  handleValidationErrors
];

// Validation rules for pagination
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// Validation rules for search
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query cannot be empty'),
  
  query('genre')
    .optional()
    .isIn(['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Children', 'Poetry', 'Drama', 'Horror', 'Thriller', 'Adventure', 'Comedy', 'Philosophy', 'Religion', 'Science', 'Technology', 'Travel', 'Cooking', 'Art', 'Music', 'Sports', 'Education', 'Politics', 'Economics', 'Psychology', 'Sociology', 'Other'])
    .withMessage('Please select a valid genre'),
  
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),
  
  query('maxRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Maximum rating must be between 0 and 5'),
  
  handleValidationErrors
];

// Validation rules for MongoDB ObjectId
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateBookCreation,
  validateBookUpdate,
  validateReviewCreation,
  validateProfileUpdate,
  validatePagination,
  validateSearch,
  validateObjectId
}; 