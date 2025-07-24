# Book Review Platform

A full-stack book review platform built with React, Node.js, Express, and MongoDB. Users can browse books, read and write reviews, rate books, and manage their reading lists.

## Features

### Frontend (React + TypeScript)
- **Responsive Design**: Modern, mobile-first UI built with Tailwind CSS
- **State Management**: Redux Toolkit for global state management
- **Routing**: React Router for navigation
- **Authentication**: JWT-based authentication with protected routes
- **Real-time Updates**: React Query for efficient data fetching and caching
- **Form Handling**: React Hook Form with validation
- **Notifications**: Toast notifications for user feedback

### Backend (Node.js + Express + MongoDB)
- **RESTful API**: Comprehensive API with proper HTTP methods
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Validation**: Express-validator for request validation
- **Security**: Helmet, CORS, rate limiting, and input sanitization
- **Database**: MongoDB with Mongoose ODM
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Core Features
- **User Management**: Registration, login, profile management
- **Book Browsing**: Search, filter, and pagination
- **Reviews & Ratings**: Create, edit, delete reviews with star ratings
- **Reading Lists**: Add/remove books from personal reading lists
- **User Profiles**: View user profiles, reviews, and statistics
- **Admin Features**: Book management for administrators



## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd book-review-platform
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/book-review-platform
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

4. **Database Setup**
   
   Make sure MongoDB is running on your system. The application will automatically create the database and collections on first run.

5. **Start the application**
   
   From the root directory:
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately:
   npm run server  # Backend only
   npm run client  # Frontend only
   ```

   The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token

### Books
- `GET /api/books` - Get all books with pagination and filtering
- `GET /api/books/:id` - Get a specific book
- `POST /api/books` - Create a new book (admin only)
- `PUT /api/books/:id` - Update a book (admin only)
- `DELETE /api/books/:id` - Delete a book (admin only)
- `GET /api/books/featured` - Get featured books
- `GET /api/books/bestsellers` - Get bestseller books
- `GET /api/books/new-releases` - Get new release books
- `GET /api/books/genres` - Get all available genres

### Reviews
- `GET /api/reviews` - Get all reviews with pagination
- `GET /api/reviews/:id` - Get a specific review
- `POST /api/reviews` - Create a new review
- `PUT /api/reviews/:id` - Update a review
- `DELETE /api/reviews/:id` - Delete a review
- `POST /api/reviews/:id/like` - Like/unlike a review
- `POST /api/reviews/:id/helpful` - Mark review as helpful

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/reviews` - Get user's reviews
- `GET /api/users/:id/reading-list` - Get user's reading list
- `POST /api/users/:id/reading-list` - Add book to reading list
- `DELETE /api/users/:id/reading-list/:bookId` - Remove book from reading list
- `GET /api/users/:id/stats` - Get user statistics

## Project Structure

```
book-review-platform/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API route handlers
│   ├── middleware/      # Custom middleware
│   ├── server.js        # Express server setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── store/       # Redux store and slices
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript type definitions
│   │   ├── utils/       # Utility functions
│   │   ├── App.tsx      # Main app component
│   │   └── index.tsx    # Entry point
│   ├── public/          # Static assets
│   └── package.json
├── package.json         # Root package.json
└── README.md
```

## Database Schema

### User
- Basic info (username, email, password, name)
- Profile data (bio, avatar, favorite genres)
- Reading list and statistics
- Role-based permissions

### Book
- Book details (title, author, description, genre)
- Metadata (ISBN, publisher, page count, language)
- Ratings and reviews count
- Status flags (featured, bestseller, new release)

### Review
- Rating and content
- User and book references
- Interaction data (likes, helpful votes)
- Reading status and format information

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Deployment

### Backend Deployment
1. Set up a MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or DigitalOcean

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or GitHub Pages
