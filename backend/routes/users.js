const express = require('express');
const User = require('../models/User');
const Review = require('../models/Review');
const Book = require('../models/Book');
const { authenticateToken, requireOwnership } = require('../middleware/auth');
const { validateProfileUpdate, validatePagination, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: user.getPublicProfile() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (Owner or Admin)
router.put('/:id', authenticateToken, validateObjectId, validateProfileUpdate, requireOwnership(req => req.params.id), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    const allowedFields = ['firstName', 'lastName', 'bio', 'favoriteGenres', 'avatar'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// @route   GET /api/users/:id/reviews
// @desc    Get all reviews by a user
// @access  Public
router.get('/:id/reviews', validateObjectId, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Check if user exists
    const user = await User.findById(req.params.id);
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
      user: req.params.id, 
      isActive: true 
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('book', 'title author coverImage averageRating totalRatings');

    // Get total count
    const total = await Review.countDocuments({ 
      user: req.params.id, 
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

// @route   GET /api/users/:id/reading-list
// @desc    Get user's reading list
// @access  Private (Owner or Admin)
router.get('/:id/reading-list', authenticateToken, validateObjectId, requireOwnership(req => req.params.id), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('readingList');

    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ readingList: user.readingList });
  } catch (error) {
    console.error('Get reading list error:', error);
    res.status(500).json({ message: 'Server error while fetching reading list' });
  }
});

// @route   POST /api/users/:id/reading-list
// @desc    Add book to user's reading list
// @access  Private (Owner)
router.post('/:id/reading-list', authenticateToken, validateObjectId, requireOwnership(req => req.params.id), async (req, res) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: 'Book ID is required' });
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book || !book.isActive) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const user = await User.findById(req.params.id);

    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if book is already in reading list
    if (user.readingList.includes(bookId)) {
      return res.status(400).json({ message: 'Book is already in reading list' });
    }

    // Add book to reading list
    user.readingList.push(bookId);
    await user.save();

    await user.populate('readingList');

    res.json({
      message: 'Book added to reading list',
      readingList: user.readingList
    });
  } catch (error) {
    console.error('Add to reading list error:', error);
    res.status(500).json({ message: 'Server error while adding to reading list' });
  }
});

// @route   DELETE /api/users/:id/reading-list/:bookId
// @desc    Remove book from user's reading list
// @access  Private (Owner)
router.delete('/:id/reading-list/:bookId', authenticateToken, validateObjectId, requireOwnership(req => req.params.id), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove book from reading list
    const bookIndex = user.readingList.indexOf(req.params.bookId);
    if (bookIndex === -1) {
      return res.status(404).json({ message: 'Book not found in reading list' });
    }

    user.readingList.splice(bookIndex, 1);
    await user.save();

    await user.populate('readingList');

    res.json({
      message: 'Book removed from reading list',
      readingList: user.readingList
    });
  } catch (error) {
    console.error('Remove from reading list error:', error);
    res.status(500).json({ message: 'Server error while removing from reading list' });
  }
});

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Public
router.get('/:id/stats', validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get review statistics
    const reviewStats = await Review.aggregate([
      { $match: { user: user._id, isActive: true } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalLikes: { $sum: '$likes.count' },
          totalHelpful: { $sum: '$helpful.count' }
        }
      }
    ]);

    // Get genre preferences
    const genreStats = await Review.aggregate([
      { $match: { user: user._id, isActive: true } },
      {
        $lookup: {
          from: 'books',
          localField: 'book',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $group: {
          _id: '$book.genre',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get reading status distribution
    const readingStatusStats = await Review.aggregate([
      { $match: { user: user._id, isActive: true } },
      {
        $group: {
          _id: '$readingStatus',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const stats = {
      totalReviews: reviewStats[0]?.totalReviews || 0,
      averageRating: reviewStats[0]?.averageRating ? Math.round(reviewStats[0].averageRating * 10) / 10 : 0,
      totalLikes: reviewStats[0]?.totalLikes || 0,
      totalHelpful: reviewStats[0]?.totalHelpful || 0,
      favoriteGenres: genreStats,
      readingStatusDistribution: readingStatusStats,
      readingListCount: user.readingList.length
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error while fetching user statistics' });
  }
});

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get('/search', validatePagination, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Build search filter
    const filter = { isActive: true };
    if (q) {
      filter.$text = { $search: q };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ score: { $meta: 'textScore' } });

    // Get total count
    const total = await User.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      users: users.map(user => user.getPublicProfile()),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error while searching users' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Deactivate user account (soft delete)
// @access  Private (Owner or Admin)
router.delete('/:id', authenticateToken, validateObjectId, requireOwnership(req => req.params.id), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    await user.save();

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error while deactivating account' });
  }
});

module.exports = router; 