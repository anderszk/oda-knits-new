import { useEffect, useRef, useState } from "react";
import { getStripe } from "./useCheckout";
import { api } from "@/api";

export default function ApplePayButton({ items, subtotal, onPaid }) {
  const mountRef = useRef(null);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stripePromise = getStripe();
    if (!stripePromise || subtotal <= 0 || !mountRef.current) return undefined;
    let cancelled = false;
    let button;

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
          const { client_secret: clientSecret } = await api("/api/payments/apple-pay-intent", {
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
          style: { paymentRequestButton: { type: "check-out", theme: "dark", height: "48px" } },
        });
        button.mount(mountRef.current);
        setAvailable(true);
      });
    });

    return () => {
      cancelled = true;
      button?.unmount();
    };
  }, [items, subtotal, onPaid]);

  return (
    <div className={available ? "mb-3" : "hidden"}>
      <div ref={mountRef} />
      {error && <p className="mt-3 rounded-md bg-[#ffe3e3] px-3 py-2 text-sm font-bold text-wine">{error}</p>}
    </div>
  );
}
