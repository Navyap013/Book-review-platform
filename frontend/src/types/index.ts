// User types
export interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  favoriteGenres: string[];
  readingList: string[];
  reviewsCount: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalReviews: number;
  averageRating: number;
  totalLikes: number;
  totalHelpful: number;
  favoriteGenres: Array<{
    _id: string;
    count: number;
    averageRating: number;
  }>;
  readingStatusDistribution: Array<{
    _id: string;
    count: number;
  }>;
  readingListCount: number;
}

// Book types
export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn?: string;
  description: string;
  genre: string;
  publishedDate: string;
  publisher?: string;
  pageCount?: number;
  language: string;
  coverImage?: string;
  averageRating: number;
  totalRatings: number;
  totalReviews: number;
  price?: number;
  currency: string;
  availability: 'Available' | 'Out of Stock' | 'Pre-order' | 'Discontinued';
  tags: string[];
  featured: boolean;
  bestseller: boolean;
  newRelease: boolean;
  awards: string[];
  series?: {
    name: string;
    number: number;
  };
  readingLevel: 'Children' | 'Young Adult' | 'Adult' | 'Academic';
  contentWarnings: string[];
  createdBy: User;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Review types
export interface Review {
  _id: string;
  user: User;
  book: Book;
  rating: number;
  title: string;
  content: string;
  spoilerAlert: boolean;
  helpful: {
    count: number;
    users: string[];
  };
  likes: {
    count: number;
    users: string[];
  };
  isVerified: boolean;
  isActive: boolean;
  tags: string[];
  readingStatus: 'Want to Read' | 'Currently Reading' | 'Read' | 'DNF';
  readDate?: string;
  format: 'Hardcover' | 'Paperback' | 'E-book' | 'Audiobook' | 'Other';
  purchaseSource?: string;
  price?: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface BooksResponse extends PaginatedResponse<Book> {
  books: Book[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalBooks: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface ReviewsResponse extends PaginatedResponse<Review> {
  reviews: Review[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface BookDetailResponse {
  book: Book;
  userReview?: Review;
  recentReviews: Review[];
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// Form types
export interface ReviewFormData {
  bookId: string;
  rating: number;
  title: string;
  content: string;
  spoilerAlert: boolean;
  readingStatus: 'Want to Read' | 'Currently Reading' | 'Read' | 'DNF';
  format: 'Hardcover' | 'Paperback' | 'E-book' | 'Audiobook' | 'Other';
  price?: number;
  currency: string;
}

export interface BookFormData {
  title: string;
  author: string;
  isbn?: string;
  description: string;
  genre: string;
  publishedDate: string;
  publisher?: string;
  pageCount?: number;
  language: string;
  coverImage?: string;
  price?: number;
  currency: string;
  availability: 'Available' | 'Out of Stock' | 'Pre-order' | 'Discontinued';
  tags: string[];
  featured: boolean;
  bestseller: boolean;
  newRelease: boolean;
  awards: string[];
  series?: {
    name: string;
    number: number;
  };
  readingLevel: 'Children' | 'Young Adult' | 'Adult' | 'Academic';
  contentWarnings: string[];
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio?: string;
  favoriteGenres: string[];
  avatar?: string;
}

// Filter types
export interface BookFilters {
  q?: string;
  genre?: string;
  minRating?: number;
  maxRating?: number;
  featured?: boolean;
  bestseller?: boolean;
  newRelease?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReviewFilters {
  bookId?: string;
  userId?: string;
  rating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Component props types
export interface BookCardProps {
  book: Book;
  showActions?: boolean;
  onAddToReadingList?: (bookId: string) => void;
  onRemoveFromReadingList?: (bookId: string) => void;
  isInReadingList?: boolean;
}

export interface ReviewCardProps {
  review: Review;
  showActions?: boolean;
  onLike?: (reviewId: string) => void;
  onMarkHelpful?: (reviewId: string) => void;
  isLiked?: boolean;
  isHelpful?: boolean;
}

export interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Error types
export interface ApiError {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
} 