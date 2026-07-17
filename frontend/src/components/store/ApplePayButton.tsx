import { useEffect, useRef, useState } from "react";
import type { StripePaymentRequestButtonElement } from "@stripe/stripe-js";
import { getStripe } from "./useCheckout";
import { apiClient } from "@/api";
import type { CartLine } from "@/models/cartLine";

interface ApplePayButtonProps {
  items: CartLine[];
  subtotal: number;
  onPaid: () => void;
}

export default function ApplePayButton({ items, subtotal, onPaid }: ApplePayButtonProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window.ApplePaySession === "undefined") return undefined;

    const stripePromise = getStripe();
    if (!stripePromise || subtotal <= 0 || !mountRef.current) return undefined;
    let cancelled = false;
    let button: StripePaymentRequestButtonElement | undefined;

    stripePromise.then((stripe) => {
      if (cancelled || !stripe) return;

      const paymentRequest = stripe.paymentRequest({
        country: "NO",
        currency: "nok",
        total: { label: "Oda Knits", amount: Math.round(subtotal * 100) },
        requestPayerName: false,
        requestPayerEmail: false,
      });

      paymentRequest.on("paymentmethod", async (event) => {
        try {
          const { client_secret: clientSecret } = await apiClient.request<{ client_secret: string }>("/api/payments/apple-pay-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: items.map((line) => ({ id: line.id, title: line.title, price: line.price, size: line.size, quantity: line.quantity })) }),
          });
          const { error: confirmError } = await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: event.paymentMethod.id },
            { handleActions: false },
          );
          if (confirmError) {
            event.complete("fail");
            setError("Apple Pay payment failed. Please try again.");
            return;
          }
          event.complete("success");
          onPaid();
        } catch {
          event.complete("fail");
          setError("Apple Pay payment failed. Please try again.");
        }
      });

      paymentRequest.canMakePayment().then((result) => {
        if (cancelled || !result?.applePay) return;
        const elements = stripe.elements();
        button = elements.create("paymentRequestButton", {
          paymentRequest,
          style: { paymentRequestButton: { type: "default", theme: "dark", height: "40px" } },
        });
        button.mount(mountRef.current!);
        setAvailable(true);
      });
    });

    return () => {
      cancelled = true;
      button?.unmount();
    };
  }, [items, subtotal, onPaid]);

  return (
    <div className={available ? "" : "hidden"}>
      <div ref={mountRef} />
      {error && <p className="mt-3 rounded-md bg-[#ffe3e3] px-3 py-2 text-sm font-bold text-wine">{error}</p>}
    </div>
  );
}
