const mongoose = require('mongoose');
const dns = require('dns');

// Configure custom DNS servers to bypass local ISP/router SRV lookup issues
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Connect to MongoDB using the URI from environment variables
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Stop server if database connection fails
  }
};

module.exports = connectDB;
