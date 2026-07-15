import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import CartLineItem from "@/components/shared/CartLineItem";
import { swatchGradient } from "@/components/shared/swatchStyle";
import CheckoutSuccess from "./CheckoutSuccess";
import PaymentMethodFields from "./PaymentMethodFields";
import ShippingFields from "./ShippingFields";
import { useCheckout } from "./useCheckout";

const STEPS = [
  { id: "review", label: "Basket" },
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
];

export default function CheckoutPage({ onNavigateHome }) {
  const { updateQuantity, removeItem } = useCart();
  const {
    items, subtotal, step, setStep,
    shipping, updateShipping, shippingValid,
    paymentMethod, setPaymentMethod,
    submitting, error, order, placeOrder,
    payWithKlarna, payWithVipps, providers, realPayment,
  } = useCheckout();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const stepIndex = STEPS.findIndex((entry) => entry.id === step);
  const empty = items.length === 0 && step !== "success";

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-[clamp(1.25rem,4vw,4rem)] py-4">
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 font-bold text-ink transition hover:text-wine"
          onClick={onNavigateHome}
        >
          <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to store
        </button>
        <span className="font-display text-xl">
          Oda Knits<span className="text-star">*</span>
        </span>
        <span className="text-xs font-extrabold uppercase text-wine">Mock checkout</span>
      </header>

      {!empty && step !== "success" && (
        <ol className="flex items-center justify-center gap-3 px-6 py-7" aria-label="Checkout progress">
          {STEPS.map((entry, index) => {
            const done = index < stepIndex;
            const current = index === stepIndex;
            return (
              <li className="flex items-center gap-3" key={entry.id}>
                <button
                  type="button"
                  disabled={index > stepIndex}
                  onClick={() => done && setStep(entry.id)}
                  className={`flex items-center gap-2 rounded-full px-1 py-1 text-sm font-extrabold transition ${
                    current ? "text-ink" : done ? "cursor-pointer text-wine hover:text-rose" : "cursor-default text-[#b7adbb]"
                  }`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full border text-xs ${
                      current || done ? "border-ink bg-ink text-cream" : "border-ink/20 bg-white text-[#b7adbb]"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  {entry.label}
                </button>
                {index < STEPS.length - 1 && <span className="h-px w-10 bg-ink/15" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      )}

      <div className="mx-auto max-w-5xl px-[clamp(1.25rem,4vw,4rem)] pb-24">
        {empty ? (
          <div className="grid place-items-center gap-3 py-28 text-center">
            <span className="font-display text-5xl text-star" aria-hidden="true">*</span>
            <p className="m-0 font-bold text-[#6f6674]">Your basket is empty. Time to find something cozy.</p>
            <button
              type="button"
              className="mt-2 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-5 py-2.5 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink"
              onClick={onNavigateHome}
            >
              Browse the shop
            </button>
          </div>
        ) : step === "success" ? (
          <SuccessPanel order={order} onFinish={onNavigateHome} realPayment={realPayment} />
        ) : (
          <div className="grid grid-cols-[1fr_23rem] items-start gap-10 pt-2 max-[900px]:grid-cols-1">
            <AnimatePresence mode="wait">
              {step === "review" && (
                <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <h1 className="mb-1 font-display text-4xl leading-none">Your basket</h1>
                  <p className="mb-6 text-sm font-bold text-[#6f6674]">Adjust quantities or remove items before you check out.</p>
                  <ItemList items={items} updateQuantity={updateQuantity} removeItem={removeItem} />
                  <button
                    className="mt-6 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 min-[901px]:hidden"
                    type="button"
                    disabled={items.length === 0}
                    onClick={() => setStep("shipping")}
                  >
                    Continue to shipping
                  </button>
                </motion.div>
              )}

              {step === "shipping" && (
                <motion.form
                  key="shipping"
                  className="grid gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (shippingValid) setStep("payment");
                  }}
                >
                  <h1 className="mb-1 font-display text-4xl leading-none">Shipping details</h1>
                  <p className="mb-3 text-sm font-bold text-[#6f6674]">Where should we send your order?</p>
                  <ShippingFields
                    shipping={shipping}
                    updateShipping={updateShipping}
                    shippingValid={shippingValid}
                    onBack={() => setStep("review")}
                  />
                </motion.form>
              )}

              {step === "payment" && (
                <motion.div key="payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <h1 className="mb-1 font-display text-4xl leading-none">Payment</h1>
                  <PaymentMethodFields
                    items={items}
                    subtotal={subtotal}
                    providers={providers}
                    submitting={submitting}
                    error={error}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    payWithKlarna={payWithKlarna}
                    payWithVipps={payWithVipps}
                    placeOrder={placeOrder}
                    onBack={() => setStep("shipping")}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <aside className="sticky top-6 rounded-lg border border-ink/15 bg-white p-5 max-[900px]:static">
              <h2 className="mb-3 font-display text-xl leading-none">Order summary</h2>
              <OrderSummaryList items={items} />
              <div className="mt-4 grid gap-2 border-t border-ink/15 pt-4 text-sm font-bold text-[#6f6674]">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="text-ink">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className="text-ink">Free</span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-ink/15 pt-3 text-lg text-ink">
                  <span className="font-extrabold">Total</span>
                  <span className="font-extrabold">{formatPrice(subtotal)}</span>
                </div>
              </div>
              {step !== "review" && (
                <button type="button" className="mt-4 cursor-pointer text-sm font-extrabold text-wine underline-offset-2 hover:underline" onClick={() => setStep("review")}>
                  Edit basket
                </button>
              )}
              {step === "review" && (
                <button
                  className="mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 max-[900px]:hidden"
                  type="button"
                  disabled={items.length === 0}
                  onClick={() => setStep("shipping")}
                >
                  Continue to shipping
                </button>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemList({ items, updateQuantity, removeItem }) {
  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {items.map((line) => (
        <CartLineItem
          key={line.lineId}
          line={line}
          large
          onDecrease={() => updateQuantity(line.lineId, line.quantity - 1)}
          onIncrease={() => updateQuantity(line.lineId, line.quantity + 1)}
          onRemove={() => removeItem(line.lineId)}
        />
      ))}
    </ul>
  );
}

function OrderSummaryList({ items }) {
  return (
    <ul className="m-0 grid list-none gap-2.5 p-0">
      {items.map((line) => (
        <li className="flex items-center gap-2.5" key={line.lineId}>
          <span
            className="block size-9 shrink-0 rounded-md border border-ink/15"
            style={{ backgroundImage: swatchGradient(line.colors) }}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{line.title}</span>
            <span className="block text-xs font-bold text-[#6f6674]">{line.size} &middot; Qty {line.quantity}</span>
          </span>
          <span className="shrink-0 text-sm font-extrabold text-rose">{formatPrice(line.price * line.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}

function SuccessPanel({ order, onFinish, realPayment }) {
  if (!order) return null;
  return (
    <motion.div className="relative mx-auto max-w-md py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <CheckoutSuccess order={order} onFinish={onFinish} realPayment={realPayment}>
        <h1 className="mb-2 font-display text-4xl leading-none">Order placed!</h1>
      </CheckoutSuccess>
    </motion.div>
  );
}
