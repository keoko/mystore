import { fetchGraphQl } from '@dropins/tools/fetch-graphql.js';
import {
  CREATE_EMPTY_CART,
  GET_CART,
  PLACE_ORDER,
  SET_GUEST_EMAIL_ON_CART,
  SET_PAYMENT_METHOD_ON_CART,
} from './graphql.js';

const CART_KEY = 'FURNI_CART_ID';

/**
 * Get the cart saved in local storage
 */
export async function getCart(cartId) {
  if (cartId) {
    const { data, errors } = await fetchGraphQl(GET_CART, {
      variables: {
        cartId,
      },
    });
    if (errors) console.error(errors);
    return data.cart;
  }
  console.log('Missing cart id');
  return null;
}

/**
 * @param {number} total Total products
 * To refresh the number products in the cart
 */
function refreshCartTotal(total = getCart().total) {
  const cartQuantity = document.querySelector('.cart-quantity');
  cartQuantity.innerHTML = total;
}

export const clearCartId = () => {
  window.localStorage.removeItem(CART_KEY);
  refreshCartTotal(0);
};

export async function setGuestEmailOnCart(email, cartId) {
  if (cartId) {
    const { data, errors } = await fetchGraphQl(SET_GUEST_EMAIL_ON_CART, {
      variables: {
        cartId,
        email,
      },
    });
    if (errors) console.error(errors);
    return data.setGuestEmailOnCart.cart.email;
  }
  console.error('Missing cart id');
  return null;
}

const createEmptyCart = async () => {
  const { data, errors } = await fetchGraphQl(CREATE_EMPTY_CART);
  if (errors) console.error(errors);
  window.localStorage.setItem(CART_KEY, data.createEmptyCart);
  return data.createEmptyCart;
};

/**
 * Set payment method on cart
 */
export async function setPaymentMethodOnCart(
  paymentMethodId,
  cartId,
) {
  if (cartId) {
    const { data, errors } = await fetchGraphQl(SET_PAYMENT_METHOD_ON_CART, {
      variables: {
        cartId,
        paymentMethodId,
      },
    });
    if (errors) console.error(errors);
    return data.setPaymentMethodOnCart.cart.selected_payment_method;
  }
  console.error('Missing cart id');
  return null;
}

/**
 * Place Order
 */
export async function placeOrder(cartId) {
  if (cartId) {
    const { data, errors } = await fetchGraphQl(PLACE_ORDER, {
      variables: {
        cartId
      },
    });
    if (errors) console.error(errors);
    return data.placeOrder.orderV2;
  }
  console.error('Missing cart id');
  return null;
}
