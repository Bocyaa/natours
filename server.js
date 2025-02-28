const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Read the environment variables from the config.env file
dotenv.config({ path: './config.env' });
const app = require('./app'); // Import the app

// Connect to the database
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose.connect(DB).then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);

  const now = new Date(Date.now());
  fs.appendFileSync('./log.txt', `${now.toUTCString()} - ${err}\n`, 'utf-8');

  server.close(() => {
    process.exit(1);
  });
});

process.on('uncoughtException', (err) => {
  console.log('UNCOUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);

  const now = new Date(Date.now());
  fs.appendFileSync('./log.txt', `${now.toUTCString()} - ${err}\n`, 'utf-8');

  server.close(() => {
    process.exit(1);
  });
});

// SIGTERM signal will be sent from Heroku every 24h, and it shuts down the app.
// We handle that shut down gracefully: first finish all ongoing proccesses and then shut down.
process.on('SIGTERM', () => {
  console.log('❗️ SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('⛔️ Process terminated!');
  });
});
