import { fetchRates, formatFormData } from '../utils/helpers.js';
import { getCart } from './cart.js';
import { getConfigValue } from './configs.js';
// eslint-disable-next-line no-undef
const pk = await getConfigValue('stripe_pk');
console.log('pk', pk);  
const stripe = Stripe(pk);

const getTotalAmount = async (cartId) => {
//   const cart = await getCart(cartId);
//   const rates = await fetchRates();
  // hardcode currency CAD
//   const details = {
    // amount: Math.floor(cart.prices.grand_total.value * rates.CAD * 100),
    // currency: 'CAD',
//   };
  // for USD
  const detailsUSD = {
    // amount: Math.floor(cart.prices.grand_total.value * 100),
    amount: 100,
    currency: 'USD',
  };
//   return details;
  return detailsUSD;
};

const createPaymentIntent = async (cartId) => {
  const details = await getTotalAmount(cartId);
  const formBody = formatFormData(details);
  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await getConfigValue('stripe_sk')}`,
      'Content-type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  });
  const data = await res.json();
  return data;
};

const renderStripeComponent = async ({
  appearance,
  options,
  element,
  context,
  callback,
  cartId,
}) => {
  if (element && context) {
    const data = await createPaymentIntent(cartId);
    const elements = stripe.elements({
      clientSecret: data.client_secret,
      appearance,
      paymentMethodCreation: 'manual',
    });

    const paymentElement = elements.create('payment', options);
    paymentElement.mount(element);

    context.onPlaceOrder(async () => {
      await elements.submit();
      const result = await stripe.createPaymentMethod({
        elements,
      });
      if (result && result.paymentMethod && callback) {
        await callback(result.paymentMethod);
      }
    });
  }
};

export default renderStripeComponent;
