import { useState } from "react";
import { api } from "../api";
import { useCart } from "../context/CartContext";

export const PAYMENT_METHODS = [
  { id: "card", label: "Card", hint: "Visa, Mastercard" },
  { id: "vipps", label: "Vipps", hint: "Pay with your phone" },
  { id: "klarna", label: "Klarna", hint: "Pay in installments" },
];

export function useCheckout() {
  const { items, subtotal, clear } = useCart();
  const [step, setStep] = useState("review");
  const [shipping, setShipping] = useState({ name: "", email: "", address: "", city: "", postalCode: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  const updateShipping = (field, value) => setShipping((current) => ({ ...current, [field]: value }));

  const shippingValid = shipping.name.trim().length > 1
    && /\S+@\S+\.\S+/.test(shipping.email)
    && shipping.address.trim().length > 3
    && shipping.city.trim().length > 0
    && shipping.postalCode.trim().length > 2;

  const placeOrder = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        items: items.map((line) => ({ id: line.id, title: line.title, price: line.price, size: line.size, quantity: line.quantity })),
        shipping: {
          name: shipping.name.trim(),
          email: shipping.email.trim(),
          address: shipping.address.trim(),
          city: shipping.city.trim(),
          postal_code: shipping.postalCode.trim(),
          phone: shipping.phone.trim(),
        },
        payment_method: PAYMENT_METHODS.find((method) => method.id === paymentMethod)?.label || paymentMethod,
        website: "",
      };
      const result = await api("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setOrder(result);
      setStep("success");
      clear();
    } catch {
      setError("Something went wrong placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    items, subtotal, step, setStep,
    shipping, updateShipping, shippingValid,
    paymentMethod, setPaymentMethod,
    submitting, error, order, placeOrder,
  };
}
