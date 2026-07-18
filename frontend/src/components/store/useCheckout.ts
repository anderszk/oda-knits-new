import { useEffect, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { apiClient } from "@/api";
import { useCart } from "@/context/CartContext";
import {
  isShippingValid,
  toShippingPayload,
  type CreateOrderRequest,
  type OrderItemPayload,
  type OrderResponse,
  type ShippingFormState,
} from "@/models/order";

type CheckoutStep = "review" | "shipping" | "payment" | "success";

interface PaymentProviders {
  card: boolean;
  applePay: boolean;
  klarna: boolean;
  vipps: boolean;
}

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> | null {
  if (!publishableKey) return null;
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

let configPromise: Promise<PaymentProviders> | null = null;

function loadPaymentsConfig(): Promise<PaymentProviders> {
  if (!configPromise) {
    configPromise = apiClient
      .request<PaymentProviders>("/api/payments/config")
      .catch(() => ({ card: false, applePay: false, klarna: false, vipps: false }));
  }
  return configPromise;
}

const PENDING_REDIRECT_KEY = "oda-knit-pending-redirect-order";

interface PendingRedirect {
  provider: "klarna" | "vipps";
  items: OrderItemPayload[];
  shipping: ReturnType<typeof toShippingPayload>;
  reference?: string;
}

function cleanRedirectParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("payment_intent");
  url.searchParams.delete("payment_intent_client_secret");
  url.searchParams.delete("redirect_status");
  url.searchParams.delete("vipps_return");
  window.history.replaceState({}, "", url.pathname + url.search);
}

export function useCheckout() {
  const { items, subtotal, clear } = useCart();
  const [step, setStep] = useState<CheckoutStep>("review");
  const [shipping, setShipping] = useState<ShippingFormState>({ name: "", email: "", address: "", city: "", postalCode: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [realPayment, setRealPayment] = useState("");
  const [providers, setProviders] = useState<PaymentProviders>({ card: false, applePay: false, klarna: false, vipps: false });
  const [failedPayment, setFailedPayment] = useState<{ paymentMethod: string; payload: CreateOrderRequest } | null>(null);

  useEffect(() => {
    loadPaymentsConfig().then(setProviders);
  }, []);

  const updateShipping = (field: keyof ShippingFormState, value: string) => setShipping((current) => ({ ...current, [field]: value }));

  const shippingValid = isShippingValid(shipping);

  const orderItems = (): OrderItemPayload[] => items.map((line) => ({ id: line.id, title: line.title, price: line.price, size: line.size, quantity: line.quantity }));

  // Shared by placeOrder and retryOrderConfirmation so a retry after a captured-but-
  // unconfirmed payment resubmits the EXACT same payload rather than re-reading live
  // cart/shipping state, and never re-runs the actual charge.
  const submitOrder = async (paymentMethod: string, payload: CreateOrderRequest) => {
    setSubmitting(true);
    setError("");
    try {
      const result = await apiClient.request<OrderResponse>("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setOrder(result);
      setRealPayment(paymentMethod);
      setStep("success");
      setFailedPayment(null);
      clear();
    } catch {
      // The caller only reaches here after a payment provider already captured funds
      // (card/Apple Pay confirm, or a verified Klarna/Vipps redirect) — the charge is
      // real. Keep the payload so retrying re-sends this exact order instead of paying
      // again; the backend's payment_reference uniqueness makes the retry idempotent.
      setFailedPayment({ paymentMethod, payload });
      setError("Your payment went through, but we couldn't finish placing your order. Press retry — you will not be charged again.");
    } finally {
      setSubmitting(false);
    }
  };

  const placeOrder = (paymentMethod: string, paymentReference: string) => {
    const payload: CreateOrderRequest = {
      items: orderItems(),
      shipping: toShippingPayload(shipping),
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      website: "",
    };
    return submitOrder(paymentMethod, payload);
  };

  const retryOrderConfirmation = () => {
    if (!failedPayment) return Promise.resolve();
    return submitOrder(failedPayment.paymentMethod, failedPayment.payload);
  };

  const payWithKlarna = async () => {
    const stripePromise = getStripe();
    if (!stripePromise || !shippingValid) return;
    setSubmitting(true);
    setError("");
    try {
      const { client_secret: clientSecret } = await apiClient.request<{ client_secret: string }>("/api/payments/klarna-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: orderItems() }),
      });

      const shippingSnapshot = toShippingPayload(shipping);
      const pending: PendingRedirect = { provider: "klarna", items: orderItems(), shipping: shippingSnapshot };
      sessionStorage.setItem(PENDING_REDIRECT_KEY, JSON.stringify(pending));

      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe unavailable");
      const { error: confirmError } = await stripe.confirmKlarnaPayment(clientSecret, {
        payment_method: {
          billing_details: {
            name: shippingSnapshot.name,
            email: shippingSnapshot.email,
            address: {
              line1: shippingSnapshot.address,
              city: shippingSnapshot.city,
              postal_code: shippingSnapshot.postal_code,
              country: "NO",
            },
          },
        },
        // Klarna leaves the page entirely; the browser lands back on the dedicated
        // checkout page (not the mobile modal, which has no URL to return to).
        return_url: `${window.location.origin}/checkout`,
      });

      if (confirmError) {
        sessionStorage.removeItem(PENDING_REDIRECT_KEY);
        setError("Klarna payment could not be started. Please try again.");
        setSubmitting(false);
      }
      // On success Stripe navigates the browser away — nothing else to do here.
    } catch {
      sessionStorage.removeItem(PENDING_REDIRECT_KEY);
      setError("Klarna payment could not be started. Please try again.");
      setSubmitting(false);
    }
  };

  const payWithVipps = async () => {
    if (!shippingValid) return;
    setSubmitting(true);
    setError("");
    try {
      const items_ = orderItems();
      const shippingSnapshot = toShippingPayload(shipping);
      const { redirect_url: redirectUrl, reference } = await apiClient.request<{ redirect_url: string; reference: string }>("/api/payments/vipps-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items_, return_url: `${window.location.origin}/checkout?vipps_return=1` }),
      });

      const pending: PendingRedirect = { provider: "vipps", reference, items: items_, shipping: shippingSnapshot };
      sessionStorage.setItem(PENDING_REDIRECT_KEY, JSON.stringify(pending));
      window.location.href = redirectUrl;
      // Browser navigates away — nothing else to do here.
    } catch {
      sessionStorage.removeItem(PENDING_REDIRECT_KEY);
      setError("Vipps payment could not be started. Please try again.");
      setSubmitting(false);
    }
  };

  // Runs once on mount to pick up a return from a Klarna or Vipps redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripePaymentIntent = params.get("payment_intent");
    const vippsReturn = params.get("vipps_return");
    if (!stripePaymentIntent && !vippsReturn) return;

    const pendingRaw = sessionStorage.getItem(PENDING_REDIRECT_KEY);
    const pending: PendingRedirect | null = pendingRaw ? JSON.parse(pendingRaw) : null;

    const confirm = async (): Promise<{ items: OrderItemPayload[]; shipping: ReturnType<typeof toShippingPayload>; paymentMethod: string; paymentReference: string }> => {
      if (stripePaymentIntent) {
        if (params.get("redirect_status") !== "succeeded" || !pending || pending.provider !== "klarna") {
          throw new Error("not confirmed");
        }
        const status = await apiClient.request<{ status: string }>(`/api/payments/klarna-status?payment_intent=${encodeURIComponent(stripePaymentIntent)}`);
        if (status.status !== "succeeded") throw new Error("not confirmed");
        return { items: pending.items, shipping: pending.shipping, paymentMethod: "Klarna", paymentReference: stripePaymentIntent };
      }
      if (!pending || pending.provider !== "vipps" || !pending.reference) throw new Error("not confirmed");
      const status = await apiClient.request<{ state: string }>(`/api/payments/vipps-status?reference=${encodeURIComponent(pending.reference)}`);
      if (status.state !== "AUTHORIZED") throw new Error("not confirmed");
      return { items: pending.items, shipping: pending.shipping, paymentMethod: "Vipps", paymentReference: pending.reference };
    };

    setSubmitting(true);
    confirm()
      .then(async ({ items: pendingItems, shipping: pendingShipping, paymentMethod: label, paymentReference }) => {
        const result = await apiClient.request<OrderResponse>("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: pendingItems, shipping: pendingShipping, payment_method: label, payment_reference: paymentReference, website: "" }),
        });
        setOrder(result);
        setRealPayment(label);
        setStep("success");
        clear();
      })
      .catch(() => {
        setError("We couldn't confirm your payment. If you were charged, please contact us.");
        setStep("payment");
      })
      .finally(() => {
        sessionStorage.removeItem(PENDING_REDIRECT_KEY);
        setSubmitting(false);
        cleanRedirectParams();
      });
    // Intentionally only runs once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    items, subtotal, step, setStep,
    shipping, updateShipping, shippingValid,
    submitting, error, order, placeOrder,
    payWithKlarna, payWithVipps, providers, realPayment,
    failedPayment: failedPayment !== null, retryOrderConfirmation,
  };
}
