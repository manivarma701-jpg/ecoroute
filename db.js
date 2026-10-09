const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️  MONGODB_URI is not defined in .env file.');
    return false;
  }

  if (uri.includes('<db_password>')) {
    console.warn('⚠️  MongoDB URI in .env contains placeholder "<db_password>".');
    console.warn('👉 Replace <db_password> in your .env file with your actual MongoDB password to connect to Atlas.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`🍃 MongoDB Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
