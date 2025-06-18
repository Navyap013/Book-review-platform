const express = require('express');
const Review = require('../models/Review');
const Book = require('../models/Book');
const User = require('../models/User');
const { authenticateToken, requireOwnership } = require('../middleware/auth');
const { validateReviewCreation, validatePagination, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', authenticateToken, validateReviewCreation, async (req, res) => {
  try {
    const { bookId, rating, title, content, spoilerAlert, readingStatus, format, price, currency } = req.body;

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book || !book.isActive) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if user already reviewed this book
    const existingReview = await Review.findOne({ user: req.user._id, book: bookId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this book' });
    }

    // Create new review
    const review = new Review({
      user: req.user._id,
      book: bookId,
      rating,
      title,
      content,
      spoilerAlert: spoilerAlert || false,
      readingStatus: readingStatus || 'Read',
      format: format || 'Paperback',
      price,
      currency: currency || 'USD',
      readDate: readingStatus === 'Read' ? new Date() : null
    });

    await review.save();

    // Update book statistics
    await book.updateAverageRating();

    // Update user review count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { reviewsCount: 1 }
    });

    // Populate user and book data
    await review.populate('user', 'username firstName lastName avatar');
    await review.populate('book', 'title author coverImage');

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error while creating review' });
  }
});

// @route   GET /api/reviews
// @desc    Get all reviews with pagination and filtering
// @access  Public
router.get('/', validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      bookId,
      userId,
      rating,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (bookId) filter.book = bookId;
    if (userId) filter.user = userId;
    if (rating) filter.rating = parseInt(rating);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const reviews = await Review.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'username firstName lastName avatar')
      .populate('book', 'title author coverImage averageRating');

    // Get total count
    const total = await Review.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReviews: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error while fetching reviews' });
  }
});

// @route   GET /api/reviews/:id
// @desc    Get a specific review
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'username firstName lastName avatar')
      .populate('book', 'title author coverImage averageRating totalRatings');

    if (!review || !review.isActive) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ review });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ message: 'Server error while fetching review' });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private (Owner or Admin)
router.put('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review || !review.isActive) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update review fields
    const allowedFields = ['rating', 'title', 'content', 'spoilerAlert', 'readingStatus', 'format', 'price', 'currency', 'readDate'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        review[field] = req.body[field];
      }
    });

    await review.save();

    // Update book statistics if rating changed
    if (req.body.rating !== undefined) {
      const book = await Book.findById(review.book);
      if (book) {
        await book.updateAverageRating();
      }
    }

    // Populate user and book data
    await review.populate('user', 'username firstName lastName avatar');
    await review.populate('book', 'title author coverImage');

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error while updating review' });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private (Owner or Admin)
router.delete('/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review || !review.isActive) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Soft delete
    review.isActive = false;
    await review.save();

    // Update book statistics
    const book = await Book.findById(review.book);
    if (book) {
      await book.updateAverageRating();
    }

    // Update user review count
    await User.findByIdAndUpdate(review.user, {
      $inc: { reviewsCount: -1 }
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error while deleting review' });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review || !review.isActive) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.markHelpful(req.user._id);

    res.json({
      message: 'Review helpful status updated',
      helpfulCount: review.helpful.count,
      isHelpful: review.isHelpfulByUser(req.user._id)
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ message: 'Server error while updating helpful status' });
  }
});

// @route   POST /api/reviews/:id/like
// @desc    Like/unlike a review
// @access  Private
router.post('/:id/like', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review || !review.isActive) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.toggleLike(req.user._id);

    res.json({
      message: 'Review like status updated',
      likeCount: review.likes.count,
      isLiked: review.isLikedByUser(req.user._id)
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Server error while updating like status' });
  }
});

// @route   GET /api/reviews/user/:userId
// @desc    Get all reviews by a specific user
// @access  Public
router.get('/user/:userId', validateObjectId, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Check if user exists
    const user = await User.findById(req.params.userId);
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reviews
    const reviews = await Review.find({ 
      user: req.params.userId, 
      isActive: true 
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('book', 'title author coverImage averageRating totalRatings');

    // Get total count
    const total = await Review.countDocuments({ 
      user: req.params.userId, 
      isActive: true 
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReviews: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error while fetching user reviews' });
  }
});

module.exports = router; 