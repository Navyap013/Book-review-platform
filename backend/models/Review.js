const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  spoilerAlert: {
    type: Boolean,
    default: false
  },
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  likes: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  readingStatus: {
    type: String,
    enum: ['Want to Read', 'Currently Reading', 'Read', 'DNF'],
    default: 'Read'
  },
  readDate: {
    type: Date
  },
  format: {
    type: String,
    enum: ['Hardcover', 'Paperback', 'E-book', 'Audiobook', 'Other'],
    default: 'Paperback'
  },
  purchaseSource: {
    type: String,
    trim: true,
    maxlength: 100
  },
  price: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR']
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per user per book
reviewSchema.index({ user: 1, book: 1 }, { unique: true });

// Indexes for search and filtering
reviewSchema.index({ book: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ 'helpful.count': -1 });
reviewSchema.index({ 'likes.count': -1 });

// Pre-save middleware to update book statistics
reviewSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('rating')) {
    try {
      const Book = mongoose.model('Book');
      const book = await Book.findById(this.book);
      if (book) {
        await book.updateAverageRating();
      }
    } catch (error) {
      console.error('Error updating book rating:', error);
    }
  }
  next();
});

// Pre-remove middleware to update book statistics
reviewSchema.pre('remove', async function(next) {
  try {
    const Book = mongoose.model('Book');
    const book = await Book.findById(this.book);
    if (book) {
      await book.updateAverageRating();
    }
  } catch (error) {
    console.error('Error updating book rating after review removal:', error);
  }
  next();
});

// Method to mark review as helpful
reviewSchema.methods.markHelpful = async function(userId) {
  const userIndex = this.helpful.users.indexOf(userId);
  
  if (userIndex === -1) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
  } else {
    this.helpful.users.splice(userIndex, 1);
    this.helpful.count -= 1;
  }
  
  await this.save();
  return this;
};

// Method to like/unlike review
reviewSchema.methods.toggleLike = async function(userId) {
  const userIndex = this.likes.users.indexOf(userId);
  
  if (userIndex === -1) {
    this.likes.users.push(userId);
    this.likes.count += 1;
  } else {
    this.likes.users.splice(userIndex, 1);
    this.likes.count -= 1;
  }
  
  await this.save();
  return this;
};

// Method to check if user has marked as helpful
reviewSchema.methods.isHelpfulByUser = function(userId) {
  return this.helpful.users.includes(userId);
};

// Method to check if user has liked
reviewSchema.methods.isLikedByUser = function(userId) {
  return this.likes.users.includes(userId);
};

// Virtual for formatted read date
reviewSchema.virtual('formattedReadDate').get(function() {
  if (!this.readDate) return null;
  return this.readDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for formatted price
reviewSchema.virtual('formattedPrice').get(function() {
  if (!this.price) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.price);
});

module.exports = mongoose.model('Review', reviewSchema); 