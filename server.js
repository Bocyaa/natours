// Core Node.js modules
const fs = require('fs');

// Third-part packages
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// --------------------------------------------------------------------
// CONFIGURATION SETUP
// --------------------------------------------------------------------

// Load environment variables from the config.env file
dotenv.config({ path: './config.env' });

// Import the Express application
const app = require('./app');

// --------------------------------------------------------------------
// DATABASE CONNECTION
// --------------------------------------------------------------------

// Connect to the database
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// Connect to MongoDB using Mongoose
mongoose
  .connect(DB)
  .then(() => console.log('DB connection successful!'))
  .catch((err) => {
    console.log('⛔️ DB connection failed!', err);
    server.close(() => {
      process.exit(1);
    });
  });

// --------------------------------------------------------------------
// START THE SERVER
// --------------------------------------------------------------------

const port = process.env.PORT || 8000;

// Start the Express server and listen for incoming requests
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// --------------------------------------------------------------------
// GLOBAL ERROR HANDLING
// --------------------------------------------------------------------

// Handle unhandled promise rejections (e.g., database connection errors)
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);

  // Log the error to a file for future debugging
  const now = new Date(Date.now());
  fs.appendFileSync('./log.txt', `${now.toUTCString()} - ${err}\n`, 'utf-8');

  // Gracefully shut down the server
  server.close(() => {
    process.exit(1);
  });
});

// --------------------------------------------------------------------
// HANDLE PROCESS TERMINATION (Heroku, Docker, etc.)
// --------------------------------------------------------------------

// Handle SIGTERM signal, commonly sent by hosting providers like Heroku every 24 hours to shut down the app.
// We ensure a graceful shutdown by completing ongoing processes before exiting
process.on('SIGTERM', () => {
  console.log('❗️ SIGTERM RECEIVED. Shutting down gracefully');

  // Close the server gracefully before exiting the process
  server.close(() => {
    console.log('⛔️ Process terminated!');
  });
});
