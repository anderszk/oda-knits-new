import { useEffect, useRef, useState } from "react";
import type { StripeCardCvcElement, StripeCardExpiryElement, StripeCardNumberElement } from "@stripe/stripe-js";
import { getStripe } from "./useCheckout";
import { apiClient } from "@/api";
import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/models/cartLine";

interface CardPaymentFieldProps {
  items: CartLine[];
  subtotal: number;
  onPaid: (paymentReference: string) => void;
}

const ELEMENT_STYLE = {
  base: {
    fontSize: "16px",
    color: "#241e29",
    fontFamily: "inherit",
    "::placeholder": { color: "#b7adbb" },
  },
  invalid: { color: "#8a2d3b" },
};

export default function CardPaymentField({ items, subtotal, onPaid }: CardPaymentFieldProps) {
  const numberRef = useRef<HTMLDivElement>(null);
  const expiryRef = useRef<HTMLDivElement>(null);
  const cvcRef = useRef<HTMLDivElement>(null);
  const cardNumberElRef = useRef<StripeCardNumberElement | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stripePromise = getStripe();
    if (!stripePromise || !numberRef.current || !expiryRef.current || !cvcRef.current) return undefined;
    let cancelled = false;
    let cardNumber: StripeCardNumberElement | undefined;
    let cardExpiry: StripeCardExpiryElement | undefined;
    let cardCvc: StripeCardCvcElement | undefined;

    stripePromise.then((stripe) => {
      if (cancelled || !stripe) return;
      const elements = stripe.elements();
      cardNumber = elements.create("cardNumber", { style: ELEMENT_STYLE, placeholder: "1234 1234 1234 1234" });
      cardExpiry = elements.create("cardExpiry", { style: ELEMENT_STYLE });
      cardCvc = elements.create("cardCvc", { style: ELEMENT_STYLE, placeholder: "CVV" });
      cardNumber.mount(numberRef.current!);
      cardExpiry.mount(expiryRef.current!);
      cardCvc.mount(cvcRef.current!);
      cardNumberElRef.current = cardNumber;
      setReady(true);
    });

    return () => {
      cancelled = true;
      cardNumber?.unmount();
      cardExpiry?.unmount();
      cardCvc?.unmount();
      cardNumberElRef.current = null;
    };
  }, []);

  const submit = async () => {
    const stripePromise = getStripe();
    const cardNumber = cardNumberElRef.current;
    if (!stripePromise || !cardNumber) return;
    setSubmitting(true);
    setError("");
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe unavailable");
      const { client_secret: clientSecret } = await apiClient.request<{ client_secret: string }>("/api/payments/card-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((line) => ({ id: line.id, title: line.title, price: line.price, size: line.size, quantity: line.quantity })) }),
      });
      const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardNumber } });
      if (confirmError || !paymentIntent) {
        setError(confirmError?.message || "Card payment failed. Please check your details and try again.");
        setSubmitting(false);
        return;
      }
      onPaid(paymentIntent.id);
    } catch {
      setError("Card payment failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-extrabold uppercase text-[#8a8191]">Card number</label>
      <div className="rounded-lg border border-ink/15 bg-white px-3 py-3" ref={numberRef} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-extrabold uppercase text-[#8a8191]">Expiry (MM / YY)</label>
          <div className="rounded-lg border border-ink/15 bg-white px-3 py-3" ref={expiryRef} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-extrabold uppercase text-[#8a8191]">CVV</label>
          <div className="rounded-lg border border-ink/15 bg-white px-3 py-3" ref={cvcRef} />
        </div>
      </div>
      {error && <p className="mt-3 rounded-md bg-[#ffe3e3] px-3 py-2 text-sm font-bold text-wine">{error}</p>}
      <button
        type="button"
        className="mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink disabled:pointer-events-none disabled:cursor-wait disabled:opacity-60"
        onClick={submit}
        disabled={!ready || submitting}
      >
        {submitting ? "Placing order…" : `Pay ${formatPrice(subtotal)}`}
      </button>
    </div>
  );
}
