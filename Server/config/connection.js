const mongoose = require('mongoose');

// Check if MONGODB_URI environment variable is set
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set.');
    process.exit(1); // Exit process if MONGODB_URI is not set
}

// Connect to MongoDB using the provided URI
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
    });

module.exports = mongoose.connection;
