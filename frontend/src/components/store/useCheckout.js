import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { api } from "@/api";
import { useCart } from "@/context/CartContext";

export const PAYMENT_METHODS = [
  { id: "card", label: "Card", hint: "Visa, Mastercard" },
];

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
let stripePromise = null;

export function getStripe() {
  if (!publishableKey) return null;
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

let configPromise = null;

function loadPaymentsConfig() {
  if (!configPromise) {
    configPromise = api("/api/payments/config").catch(() => ({ applePay: false, klarna: false, vipps: false }));
  }
  return configPromise;
}

const PENDING_REDIRECT_KEY = "oda-knit-pending-redirect-order";

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
  const [step, setStep] = useState("review");
  const [shipping, setShipping] = useState({ name: "", email: "", address: "", city: "", postalCode: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [realPayment, setRealPayment] = useState(null);
  const [providers, setProviders] = useState({ applePay: false, klarna: false, vipps: false });

  useEffect(() => {
    loadPaymentsConfig().then(setProviders);
  }, []);

  const updateShipping = (field, value) => setShipping((current) => ({ ...current, [field]: value }));

  const shippingValid = shipping.name.trim().length > 1
    && /\S+@\S+\.\S+/.test(shipping.email)
    && shipping.address.trim().length > 3
    && shipping.city.trim().length > 0
    && shipping.postalCode.trim().length > 2;

  const trimmedShipping = () => ({
    name: shipping.name.trim(),
    email: shipping.email.trim(),
    address: shipping.address.trim(),
    city: shipping.city.trim(),
    postal_code: shipping.postalCode.trim(),
    phone: shipping.phone.trim(),
  });

  const orderItems = () => items.map((line) => ({ id: line.id, title: line.title, price: line.price, size: line.size, quantity: line.quantity }));

  const placeOrder = async (overridePaymentMethod) => {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        items: orderItems(),
        shipping: trimmedShipping(),
        payment_method: overridePaymentMethod || PAYMENT_METHODS.find((method) => method.id === paymentMethod)?.label || paymentMethod,
        website: "",
      };
      const result = await api("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setOrder(result);
      setRealPayment(overridePaymentMethod || null);
      setStep("success");
      clear();
    } catch {
      setError("Something went wrong placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const payWithKlarna = async () => {
    const stripePromise = getStripe();
    if (!stripePromise || !shippingValid) return;
    setSubmitting(true);
    setError("");
    try {
      const { client_secret: clientSecret } = await api("/api/payments/klarna-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: orderItems() }),
      });

      const shippingSnapshot = trimmedShipping();
      sessionStorage.setItem(PENDING_REDIRECT_KEY, JSON.stringify({ provider: "klarna", items: orderItems(), shipping: shippingSnapshot }));

      const stripe = await stripePromise;
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
      const shippingSnapshot = trimmedShipping();
      const { redirect_url: redirectUrl, reference } = await api("/api/payments/vipps-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items_, return_url: `${window.location.origin}/checkout?vipps_return=1` }),
      });

      sessionStorage.setItem(PENDING_REDIRECT_KEY, JSON.stringify({ provider: "vipps", reference, items: items_, shipping: shippingSnapshot }));
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
    const pending = pendingRaw ? JSON.parse(pendingRaw) : null;

    const confirm = async () => {
      if (stripePaymentIntent) {
        if (params.get("redirect_status") !== "succeeded" || !pending || pending.provider !== "klarna") {
          throw new Error("not confirmed");
        }
        const status = await api(`/api/payments/klarna-status?payment_intent=${encodeURIComponent(stripePaymentIntent)}`);
        if (status.status !== "succeeded") throw new Error("not confirmed");
        return { ...pending, paymentMethod: "Klarna" };
      }
      if (!pending || pending.provider !== "vipps") throw new Error("not confirmed");
      const status = await api(`/api/payments/vipps-status?reference=${encodeURIComponent(pending.reference)}`);
      if (status.state !== "AUTHORIZED") throw new Error("not confirmed");
      return { ...pending, paymentMethod: "Vipps" };
    };

    setSubmitting(true);
    confirm()
      .then(async ({ items: pendingItems, shipping: pendingShipping, paymentMethod: label }) => {
        const result = await api("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: pendingItems, shipping: pendingShipping, payment_method: label, website: "" }),
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
    paymentMethod, setPaymentMethod,
    submitting, error, order, placeOrder,
    payWithKlarna, payWithVipps, providers, realPayment,
  };
}
