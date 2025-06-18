import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  Book,
  Review,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  BooksResponse,
  ReviewsResponse,
  BookDetailResponse,
  ReviewFormData,
  BookFormData,
  ProfileFormData,
  BookFilters,
  ReviewFilters,
  UserStats,
} from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },
};

// Books API
export const booksAPI = {
  getBooks: async (filters?: BookFilters, page = 1, limit = 12): Promise<BooksResponse> => {
    const params = new URLSearchParams();
    if (filters?.q) params.append('q', filters.q);
    if (filters?.genre) params.append('genre', filters.genre);
    if (filters?.minRating) params.append('minRating', filters.minRating.toString());
    if (filters?.maxRating) params.append('maxRating', filters.maxRating.toString());
    if (filters?.featured) params.append('featured', filters.featured.toString());
    if (filters?.bestseller) params.append('bestseller', filters.bestseller.toString());
    if (filters?.newRelease) params.append('newRelease', filters.newRelease.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/books?${params.toString()}`);
    return response.data;
  },

  getBook: async (id: string): Promise<BookDetailResponse> => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  getFeaturedBooks: async (): Promise<{ books: Book[] }> => {
    const response = await api.get('/books/featured');
    return response.data;
  },

  getBestsellers: async (): Promise<{ books: Book[] }> => {
    const response = await api.get('/books/bestsellers');
    return response.data;
  },

  getNewReleases: async (): Promise<{ books: Book[] }> => {
    const response = await api.get('/books/new-releases');
    return response.data;
  },

  getGenres: async (): Promise<{ genres: Array<{ _id: string; count: number }> }> => {
    const response = await api.get('/books/genres');
    return response.data;
  },

  createBook: async (bookData: BookFormData): Promise<{ message: string; book: Book }> => {
    const response = await api.post('/books', bookData);
    return response.data;
  },

  updateBook: async (id: string, bookData: Partial<BookFormData>): Promise<{ message: string; book: Book }> => {
    const response = await api.put(`/books/${id}`, bookData);
    return response.data;
  },

  deleteBook: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },

  getBookReviews: async (id: string, page = 1, limit = 10): Promise<ReviewsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await api.get(`/books/${id}/reviews?${params.toString()}`);
    return response.data;
  },
};

// Reviews API
export const reviewsAPI = {
  getReviews: async (filters?: ReviewFilters, page = 1, limit = 10): Promise<ReviewsResponse> => {
    const params = new URLSearchParams();
    if (filters?.bookId) params.append('bookId', filters.bookId);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.rating) params.append('rating', filters.rating.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/reviews?${params.toString()}`);
    return response.data;
  },

  getReview: async (id: string): Promise<{ review: Review }> => {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },

  createReview: async (reviewData: ReviewFormData): Promise<{ message: string; review: Review }> => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  updateReview: async (id: string, reviewData: Partial<ReviewFormData>): Promise<{ message: string; review: Review }> => {
    const response = await api.put(`/reviews/${id}`, reviewData);
    return response.data;
  },

  deleteReview: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },

  likeReview: async (id: string): Promise<{ message: string; likeCount: number; isLiked: boolean }> => {
    const response = await api.post(`/reviews/${id}/like`);
    return response.data;
  },

  markHelpful: async (id: string): Promise<{ message: string; helpfulCount: number; isHelpful: boolean }> => {
    const response = await api.post(`/reviews/${id}/helpful`);
    return response.data;
  },

  getUserReviews: async (userId: string, page = 1, limit = 10): Promise<ReviewsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await api.get(`/reviews/user/${userId}?${params.toString()}`);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getUser: async (id: string): Promise<{ user: User }> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateProfile: async (id: string, profileData: ProfileFormData): Promise<{ message: string; user: User }> => {
    const response = await api.put(`/users/${id}`, profileData);
    return response.data;
  },

  getUserReviews: async (id: string, page = 1, limit = 10): Promise<ReviewsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await api.get(`/users/${id}/reviews?${params.toString()}`);
    return response.data;
  },

  getReadingList: async (id: string): Promise<{ readingList: Book[] }> => {
    const response = await api.get(`/users/${id}/reading-list`);
    return response.data;
  },

  addToReadingList: async (userId: string, bookId: string): Promise<{ message: string; readingList: Book[] }> => {
    const response = await api.post(`/users/${userId}/reading-list`, { bookId });
    return response.data;
  },

  removeFromReadingList: async (userId: string, bookId: string): Promise<{ message: string; readingList: Book[] }> => {
    const response = await api.delete(`/users/${userId}/reading-list/${bookId}`);
    return response.data;
  },

  getUserStats: async (id: string): Promise<{ stats: UserStats }> => {
    const response = await api.get(`/users/${id}/stats`);
    return response.data;
  },

  searchUsers: async (query: string, page = 1, limit = 10): Promise<{ users: User[]; pagination: any }> => {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await api.get(`/users/search?${params.toString()}`);
    return response.data;
  },

  deactivateAccount: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export default api; 