// 1. Core Node.js Modules
const path = require('path');

// 2. Third-Party Packages
// 2.1 Express framework and middleware
const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');

// 2.2 Security Related Packages
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// 3. Custom Modules
// 3.1 Utilities and error handling
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// 3.2 Routers
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// 3.3 Controllers
const bookingCtrl = require('./controllers/bookingController');

// --------------------------------------------------------------------
// APP INITIALIZATION
// --------------------------------------------------------------------

const app = express();

// Enable reverse proxy support (for Heroku, Nginx, etc.)
app.enable('trust proxy');

// Set Pug as the view engine and define views directory
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// --------------------------------------------------------------------
// 1) GLOBAL MIDDLEWARES
// --------------------------------------------------------------------

// Implement CORS (Cross-Origin-Resource-Sharing)
app.use(cors());
app.options('*', cors()); // Allow pre-flight requests for all routes

// Serving static files (e.g. images, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers using Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://cdnjs.cloudflare.com',
          'blob:',
          'https://js.stripe.com',
        ],
        styleSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://fonts.googleapis.com',
          "'unsafe-inline'",
        ],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: [
          "'self'",
          'ws://127.0.0.1:*',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://js.stripe.com',
        ],
        workerSrc: ["'self'", 'blob:'],
        childSrc: ["'self'", 'blob:'],
        frameSrc: ["'self'", 'https://js.stripe.com'],
      },
    },
  }),
);

// Logging middleware - only in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting to prevent abuse (100 requests per hour per IP)
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Stripe webhook for checkout (needs raw body parsing)
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingCtrl.webhookCheckout,
);

// Parse JSON and URL-encoded data (body parsing )
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // Parse cookies

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS (Cross-Site Scripting)
app.use(xss());

// Prevent parameter pollution (e.g. repeated query parameters)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Response compression for faster loading
app.use(compression());

// Custom middleware to add request timestamp
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// --------------------------------------------------------------------
// 2) ROUTE HANDLERS
// --------------------------------------------------------------------

// Define route handlers for different endpoints
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Catch-all route handler for unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

// --------------------------------------------------------------------
// EXPORT APP
// --------------------------------------------------------------------

module.exports = app;
