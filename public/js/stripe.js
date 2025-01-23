import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51Qk2jmJqp3rCO8em65ehvFWkbl9yFZFIrRnBT297L3oA0YxU8SPbfD6BFry93g4fC9zH8EdP7a1JG9ux4JSiY02100DRTjp4dZ',
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
