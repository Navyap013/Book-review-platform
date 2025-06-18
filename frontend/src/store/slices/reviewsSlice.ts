import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Review, ReviewFilters, ReviewsResponse, ReviewFormData } from '../../types';
import { reviewsAPI } from '../../services/api';

interface ReviewsState {
  reviews: Review[];
  currentReview: Review | null;
  filters: ReviewFilters;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ReviewsState = {
  reviews: [],
  currentReview: null,
  filters: {},
  pagination: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async ({ filters, page = 1, limit = 10 }: { filters?: ReviewFilters; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await reviewsAPI.getReviews(filters, page, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

export const fetchReview = createAsyncThunk(
  'reviews/fetchReview',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await reviewsAPI.getReview(id);
      return response.review;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch review');
    }
  }
);

export const createReview = createAsyncThunk(
  'reviews/createReview',
  async (reviewData: ReviewFormData, { rejectWithValue }) => {
    try {
      const response = await reviewsAPI.createReview(reviewData);
      return response.review;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create review');
    }
  }
);

export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ id, reviewData }: { id: string; reviewData: Partial<ReviewFormData> }, { rejectWithValue }) => {
    try {
      const response = await reviewsAPI.updateReview(id, reviewData);
      return response.review;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update review');
    }
  }
);

export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (id: string, { rejectWithValue }) => {
    try {
      await reviewsAPI.deleteReview(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete review');
    }
  }
);

export const likeReview = createAsyncThunk(
  'reviews/likeReview',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await reviewsAPI.likeReview(id);
      return { id, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like review');
    }
  }
);

export const markHelpful = createAsyncThunk(
  'reviews/markHelpful',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await reviewsAPI.markHelpful(id);
      return { id, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark review as helpful');
    }
  }
);

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<ReviewFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearCurrentReview: (state) => {
      state.currentReview = null;
    },
    addReview: (state, action: PayloadAction<Review>) => {
      state.reviews.unshift(action.payload);
    },
    updateReviewInList: (state, action: PayloadAction<Review>) => {
      const index = state.reviews.findIndex(review => review._id === action.payload._id);
      if (index !== -1) {
        state.reviews[index] = action.payload;
      }
      if (state.currentReview && state.currentReview._id === action.payload._id) {
        state.currentReview = action.payload;
      }
    },
    removeReview: (state, action: PayloadAction<string>) => {
      state.reviews = state.reviews.filter(review => review._id !== action.payload);
      if (state.currentReview && state.currentReview._id === action.payload) {
        state.currentReview = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch reviews
      .addCase(fetchReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action: PayloadAction<ReviewsResponse>) => {
        state.isLoading = false;
        state.reviews = action.payload.reviews;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch single review
      .addCase(fetchReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReview.fulfilled, (state, action: PayloadAction<Review>) => {
        state.isLoading = false;
        state.currentReview = action.payload;
        state.error = null;
      })
      .addCase(fetchReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create review
      .addCase(createReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action: PayloadAction<Review>) => {
        state.isLoading = false;
        state.reviews.unshift(action.payload);
        state.error = null;
      })
      .addCase(createReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update review
      .addCase(updateReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action: PayloadAction<Review>) => {
        state.isLoading = false;
        const index = state.reviews.findIndex(review => review._id === action.payload._id);
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
        if (state.currentReview && state.currentReview._id === action.payload._id) {
          state.currentReview = action.payload;
        }
        state.error = null;
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete review
      .addCase(deleteReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.reviews = state.reviews.filter(review => review._id !== action.payload);
        if (state.currentReview && state.currentReview._id === action.payload) {
          state.currentReview = null;
        }
        state.error = null;
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Like review
      .addCase(likeReview.fulfilled, (state, action: PayloadAction<{ id: string; likeCount: number; isLiked: boolean }>) => {
        const { id, likeCount, isLiked } = action.payload;
        const review = state.reviews.find(r => r._id === id);
        if (review) {
          review.likes.count = likeCount;
          if (isLiked) {
            review.likes.users.push('current-user'); // This should be the actual user ID
          } else {
            review.likes.users = review.likes.users.filter(userId => userId !== 'current-user');
          }
        }
        if (state.currentReview && state.currentReview._id === id) {
          state.currentReview.likes.count = likeCount;
          if (isLiked) {
            state.currentReview.likes.users.push('current-user');
          } else {
            state.currentReview.likes.users = state.currentReview.likes.users.filter(userId => userId !== 'current-user');
          }
        }
      })
      // Mark helpful
      .addCase(markHelpful.fulfilled, (state, action: PayloadAction<{ id: string; helpfulCount: number; isHelpful: boolean }>) => {
        const { id, helpfulCount, isHelpful } = action.payload;
        const review = state.reviews.find(r => r._id === id);
        if (review) {
          review.helpful.count = helpfulCount;
          if (isHelpful) {
            review.helpful.users.push('current-user'); // This should be the actual user ID
          } else {
            review.helpful.users = review.helpful.users.filter(userId => userId !== 'current-user');
          }
        }
        if (state.currentReview && state.currentReview._id === id) {
          state.currentReview.helpful.count = helpfulCount;
          if (isHelpful) {
            state.currentReview.helpful.users.push('current-user');
          } else {
            state.currentReview.helpful.users = state.currentReview.helpful.users.filter(userId => userId !== 'current-user');
          }
        }
      });
  },
});

export const { 
  clearError, 
  setFilters, 
  clearFilters, 
  clearCurrentReview, 
  addReview, 
  updateReviewInList, 
  removeReview 
} = reviewsSlice.actions;
export default reviewsSlice.reducer; 