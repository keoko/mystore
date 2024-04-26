/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */

// Drop-in Tools
import { initializers } from '@dropins/tools/initializer.js';
import { events } from '@dropins/tools/event-bus.js';

// Drop-in APIs
import * as checkout from '@dropins/storefront-checkout/api.js';

// Drop-in Providers
import { render as provider } from '@dropins/storefront-checkout/render.js';

// Drop-in Containers
import Checkout from '@dropins/storefront-checkout/containers/Checkout.js';

import renderStripeComponent from '../../scripts/stripe.js';
import {
  placeOrder, setPaymentMethodOnCart,
} from '../../scripts/cart.js';
import { loadLoading } from '../../utils/helpers.js';

async function proceedPlaceOrder(block, cartId, paymentMethod) {
  const loading = await loadLoading();
  await setPaymentMethodOnCart(paymentMethod.id, cartId);
  const order = await placeOrder(cartId);
  loading.remove();

  console.log('order', order);
  if (order) {
    events.emit('checkout/order', order);

    events.emit('cart/reset', undefined);
  }
  
}

export default async function decorate(block) {
  // If cartId is cached in session storage, use
  // otherwise, checkout drop-in will look for one in the event-bus
  const cartId = sessionStorage.getItem('DROPINS_CART_ID') || '';

  // Initialize Drop-ins
  initializers.register(checkout.initialize, {});

  // Listen for order confirmation and redirect to order confirmation page
  events.on('checkout/order', (data) => {
    const orderRef = encodeURIComponent(data.token);
    window.location.replace(`/order-confirmation?orderRef=${orderRef}`);
  });

  return provider.render(Checkout, {
    cartId,
    routeHome: () => '/',
    routeCart: () => '/cart',
    slots: {
      PaymentMethods: async (context) => {
        // context.addPaymentMethodHandler('checkmo', {
        //   render: (ctx, element) => {
        //     if (element) {
        //       // clear the element first
        //       element.innerHTML = '';
        //     }

        //     // Optionally, create and render some custom content here.
        //     // const $content = document.createElement('div');
        //     // $content.innerText = 'Custom Check / Money order handler';
        //     // ctx.appendHTMLElement($content);
        //   },
        // });
        context.addPaymentMethodHandler('stripe_payments', {
          render: async (ctx, element) => {
            console.log('loading stripe...', ctx, element);
            await renderStripeComponent({
              element,
              context: ctx,
              cartId,
              callback: (paymentMethod) => proceedPlaceOrder(block, cartId, paymentMethod),
            });
          },
        });
      },
    },
  })(block);
}
