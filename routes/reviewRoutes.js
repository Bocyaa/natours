const express = require('express');
const reviewCtrl = require('./../controllers/reviewController');
const authCtrl = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authCtrl.protect);

router
  .route('/')
  .get(reviewCtrl.getAllReviews)
  .post(
    authCtrl.restrictTo('user'),
    reviewCtrl.setTourUserIds,
    reviewCtrl.createReview
  );

router
  .route('/:id')
  .get(reviewCtrl.getReview)
  .patch(authCtrl.restrictTo('admin', 'user'), reviewCtrl.updateReview)
  .delete(authCtrl.restrictTo('admin', 'user'), reviewCtrl.deleteReview);

module.exports = router;
