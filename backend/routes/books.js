const express = require('express');
const Book = require('../models/Book');
const Review = require('../models/Review');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateBookCreation, validateBookUpdate, validatePagination, validateSearch, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/books
// @desc    Get all books with pagination, search, and filtering
// @access  Public
router.get('/', validatePagination, validateSearch, optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      q,
      genre,
      minRating,
      maxRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured,
      bestseller,
      newRelease
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // Search query
    if (q) {
      filter.$text = { $search: q };
    }

    // Genre filter
    if (genre) {
      filter.genre = genre;
    }

    // Rating filters
    if (minRating || maxRating) {
      filter.averageRating = {};
      if (minRating) filter.averageRating.$gte = parseFloat(minRating);
      if (maxRating) filter.averageRating.$lte = parseFloat(maxRating);
    }

    // Boolean filters
    if (featured === 'true') filter.featured = true;
    if (bestseller === 'true') filter.bestseller = true;
    if (newRelease === 'true') filter.newRelease = true;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const books = await Book.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'username firstName lastName');

    // Get total count for pagination
    const total = await Book.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      books,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBooks: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ message: 'Server error while fetching books' });
  }
});

// @route   GET /api/books/featured
// @desc    Get featured books
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const featuredBooks = await Book.find({ 
      featured: true, 
      isActive: true 
    })
    .sort({ averageRating: -1, totalRatings: -1 })
    .limit(6)
    .populate('createdBy', 'username firstName lastName');

    res.json({ books: featuredBooks });
  } catch (error) {
    console.error('Get featured books error:', error);
    res.status(500).json({ message: 'Server error while fetching featured books' });
  }
});

// @route   GET /api/books/bestsellers
// @desc    Get bestseller books
// @access  Public
router.get('/bestsellers', async (req, res) => {
  try {
    const bestsellerBooks = await Book.find({ 
      bestseller: true, 
      isActive: true 
    })
    .sort({ averageRating: -1, totalRatings: -1 })
    .limit(10)
    .populate('createdBy', 'username firstName lastName');

    res.json({ books: bestsellerBooks });
  } catch (error) {
    console.error('Get bestseller books error:', error);
    res.status(500).json({ message: 'Server error while fetching bestseller books' });
  }
});

// @route   GET /api/books/new-releases
// @desc    Get new release books
// @access  Public
router.get('/new-releases', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newReleaseBooks = await Book.find({ 
      newRelease: true, 
      isActive: true,
      publishedDate: { $gte: thirtyDaysAgo }
    })
    .sort({ publishedDate: -1 })
    .limit(8)
    .populate('createdBy', 'username firstName lastName');

    res.json({ books: newReleaseBooks });
  } catch (error) {
    console.error('Get new release books error:', error);
    res.status(500).json({ message: 'Server error while fetching new release books' });
  }
});

// @route   GET /api/books/genres
// @desc    Get all available genres with book counts
// @access  Public
router.get('/genres', async (req, res) => {
  try {
    const genres = await Book.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$genre',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ genres });
  } catch (error) {
    console.error('Get genres error:', error);
    res.status(500).json({ message: 'Server error while fetching genres' });
  }
});

// @route   GET /api/books/:id
// @desc    Get a specific book by ID
// @access  Public
router.get('/:id', validateObjectId, optionalAuth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('createdBy', 'username firstName lastName');

    if (!book || !book.isActive) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Get user's review if authenticated
    let userReview = null;
    if (req.user) {
      userReview = await Review.findOne({ 
        user: req.user._id, 
        book: req.params.id 
      });
    }

    // Get recent reviews
    const recentReviews = await Review.find({ 
      book: req.params.id, 
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'username firstName lastName avatar');

    res.json({
      book,
      userReview,
      recentReviews
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ message: 'Server error while fetching book' });
  }
});

// @route   POST /api/books
// @desc    Create a new book (admin only)
// @access  Private (Admin)
router.post('/', authenticateToken, requireAdmin, validateBookCreation, async (req, res) => {
  try {
    const bookData = {
      ...req.body,
      createdBy: req.user._id
    };

    const book = new Book(bookData);
    await book.save();

    await book.populate('createdBy', 'username firstName lastName');

    res.status(201).json({
      message: 'Book created successfully',
      book
    });
  } catch (error) {
    console.error('Create book error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Book with this ISBN already exists' });
    }
    res.status(500).json({ message: 'Server error while creating book' });
  }
});

// @route   PUT /api/books/:id
// @desc    Update a book (admin only)
// @access  Private (Admin)
router.put('/:id', authenticateToken, requireAdmin, validateObjectId, validateBookUpdate, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Update book fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        book[key] = req.body[key];
      }
    });

    await book.save();
    await book.populate('createdBy', 'username firstName lastName');

    res.json({
      message: 'Book updated successfully',
      book
    });
  } catch (error) {
    console.error('Update book error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Book with this ISBN already exists' });
    }
    res.status(500).json({ message: 'Server error while updating book' });
  }
});

// @route   DELETE /api/books/:id
// @desc    Delete a book (admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireAdmin, validateObjectId, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Soft delete - mark as inactive
    book.isActive = false;
    await book.save();

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ message: 'Server error while deleting book' });
  }
});

// @route   GET /api/books/:id/reviews
// @desc    Get all reviews for a book
// @access  Public
router.get('/:id/reviews', validateObjectId, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Check if book exists
    const book = await Book.findById(req.params.id);
    if (!book || !book.isActive) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reviews
    const reviews = await Review.find({ 
      book: req.params.id, 
      isActive: true 
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'username firstName lastName avatar');

    // Get total count
    const total = await Review.countDocuments({ 
      book: req.params.id, 
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
    console.error('Get book reviews error:', error);
    res.status(500).json({ message: 'Server error while fetching reviews' });
  }
});

module.exports = router; 