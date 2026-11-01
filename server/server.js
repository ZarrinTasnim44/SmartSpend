// server.js - SmartSpend backend entry point
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize the Express application
const app = express();

// Middleware
app.use(cors()); // Allows frontend applications to communicate with this API
app.use(express.json()); // Allows server to parse incoming JSON request bodies

// Basic test route
app.get('/', (req, res) => {
  res.send('SmartSpend Server is running');
});

// API Routes
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Define server port
const PORT = process.env.PORT || 5000;

// Start listening for requests
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
