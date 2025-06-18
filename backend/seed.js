const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Book = require('./models/Book');
const Review = require('./models/Review');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/book-review-platform');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Book.deleteMany({});
    await Review.deleteMany({});

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const admin = await User.create({
      username: 'admin',
      email: 'admin@bookreview.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    // Create sample books
    const books = await Book.create([
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
        genre: 'Fiction',
        publishedDate: '1925-04-10',
        featured: true,
        bestseller: true,
        createdBy: admin._id
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        description: 'The story of young Scout Finch and her father Atticus in a racially divided Alabama town.',
        genre: 'Fiction',
        publishedDate: '1960-07-11',
        featured: true,
        bestseller: true,
        createdBy: admin._id
      }
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase(); 