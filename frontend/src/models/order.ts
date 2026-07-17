export interface OrderItemPayload {
  id: string;
  title: string;
  price: number;
  size: string;
  quantity: number;
}

// Wire shape sent to the backend (snake_case, matches ShippingInfo in backend/models/orders.py).
export interface ShippingPayload {
  name: string;
  email: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
}

export interface CreateOrderRequest {
  items: OrderItemPayload[];
  shipping: ShippingPayload;
  payment_method: string;
  payment_reference: string;
  website: string;
}

export interface OrderResponse {
  ok: boolean;
  id: string;
  subtotal: number;
}

// UI form state (camelCase) — kept separate from the wire shape above.
export interface ShippingFormState {
  name: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

export function toShippingPayload(shipping: ShippingFormState): ShippingPayload {
  return {
    name: shipping.name.trim(),
    email: shipping.email.trim(),
    address: shipping.address.trim(),
    city: shipping.city.trim(),
    postal_code: shipping.postalCode.trim(),
    phone: shipping.phone.trim(),
  };
}

export function isShippingValid(shipping: ShippingFormState): boolean {
  return (
    shipping.name.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(shipping.email) &&
    shipping.address.trim().length > 3 &&
    shipping.city.trim().length > 0 &&
    shipping.postalCode.trim().length > 2
  );
}
