const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  genre: {
    type: String,
    required: true,
    enum: ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Children', 'Poetry', 'Drama', 'Horror', 'Thriller', 'Adventure', 'Comedy', 'Philosophy', 'Religion', 'Science', 'Technology', 'Travel', 'Cooking', 'Art', 'Music', 'Sports', 'Education', 'Politics', 'Economics', 'Psychology', 'Sociology', 'Other']
  },
  publishedDate: {
    type: Date,
    required: true
  },
  publisher: {
    type: String,
    trim: true,
    maxlength: 100
  },
  pageCount: {
    type: Number,
    min: 1
  },
  language: {
    type: String,
    default: 'English',
    trim: true
  },
  coverImage: {
    type: String,
    default: ''
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR']
  },
  availability: {
    type: String,
    enum: ['Available', 'Out of Stock', 'Pre-order', 'Discontinued'],
    default: 'Available'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  featured: {
    type: Boolean,
    default: false
  },
  bestseller: {
    type: Boolean,
    default: false
  },
  newRelease: {
    type: Boolean,
    default: false
  },
  awards: [{
    type: String,
    trim: true
  }],
  series: {
    name: {
      type: String,
      trim: true
    },
    number: {
      type: Number,
      min: 1
    }
  },
  readingLevel: {
    type: String,
    enum: ['Children', 'Young Adult', 'Adult', 'Academic'],
    default: 'Adult'
  },
  contentWarnings: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for search and filtering
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ genre: 1 });
bookSchema.index({ averageRating: -1 });
bookSchema.index({ publishedDate: -1 });
bookSchema.index({ featured: 1 });
bookSchema.index({ bestseller: 1 });
bookSchema.index({ newRelease: 1 });

// Virtual for formatted price
bookSchema.virtual('formattedPrice').get(function() {
  if (!this.price) return 'Price not available';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.price);
});

// Virtual for rating stars
bookSchema.virtual('ratingStars').get(function() {
  const fullStars = Math.floor(this.averageRating);
  const hasHalfStar = this.averageRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return {
    full: fullStars,
    half: hasHalfStar ? 1 : 0,
    empty: emptyStars
  };
});

// Method to update average rating
bookSchema.methods.updateAverageRating = async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { book: this._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    this.averageRating = Math.round(stats[0].averageRating * 10) / 10;
    this.totalRatings = stats[0].totalRatings;
  } else {
    this.averageRating = 0;
    this.totalRatings = 0;
  }

  await this.save();
};

// Pre-save middleware to ensure ISBN is unique
bookSchema.pre('save', async function(next) {
  if (this.isModified('isbn') && this.isbn) {
    const existingBook = await this.constructor.findOne({ isbn: this.isbn, _id: { $ne: this._id } });
    if (existingBook) {
      return next(new Error('ISBN already exists'));
    }
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema); 