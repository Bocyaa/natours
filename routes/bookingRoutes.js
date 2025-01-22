const express = require('express');
const bookingCtrl = require('../controllers/bookingController');
const authCtrl = require('../controllers/authController');

const router = express.Router();

router.use(authCtrl.protect);

// Code here ...
router.get('/checkout-session/:tourId', bookingCtrl.getCheckoutSession);

router.use(authCtrl.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingCtrl.getAllBookings)
  .post(bookingCtrl.createBooking);

router
  .route('/:id')
  .get(bookingCtrl.getBooking)
  .patch(bookingCtrl.updateBooking)
  .delete(bookingCtrl.deleteBooking);

module.exports = router;
