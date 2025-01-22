const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // const value = err.errorResponse.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const valueMatch = err.errorResponse?.errmsg?.match(/(["'])(\\?.)*?\1/);
  const value = valueMatch ? valueMatch[0] : 'Unknown value';

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token! Please login again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  // A) API --------------------------------------
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode || 500).json({
      status: err.status || 'error',
      error: err,
      message: err.message || 'An unknown error occurred',
      stack: err.stack,
    });
  }
  // B) RENDERED WEBSITE --------------------------------------
  console.error('#### Error Object ####', err);
  return res.status(err.statusCode || 500).render('error', {
    title: 'Something went wrong!',
    msg: err.message || 'An unknown error occurred',
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API --------------------------------------
  if (req.originalUrl.startsWith('/api')) {
    //
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode || 500).json({
        status: err.status || 'error',
        message: err.message || 'An unknown error occurred',
      });
    }
    // Fall back for unknown errors
    if (!err.isOperational) {
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong. Please try again later.',
      });
    }

    // B) Programming or other unknown error: don't leak error details
    console.error('#### Error Object ####', err);

    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // B) RENDERED WEBSITE --------------------------------------
  if (err.isOperational) {
    //
    // A) Operational, trusted error: send message to client
    return res.status(err.statusCode || 500).render('error', {
      title: 'Something went wrong!',
      msg: err.message || 'An unknown error occurred',
    });
  }

  // B) Programming or other unknown error: don't leak error details
  console.error('#### Error Object ####', err);

  return res.status(err.statusCode || 500).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // let error = { ...err, name: err.name };
    let error = Object.assign({}, err);
    error.message = err.message;
    error.name = err.name;

    if (error.name === 'CastError') error = handleCastErrorDB(error);

    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    if (error.name === 'JsonWebTokenError') error = handleJWTError();

    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
