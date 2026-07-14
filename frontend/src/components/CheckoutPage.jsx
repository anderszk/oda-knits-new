import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/format";
import { PAYMENT_METHODS, useCheckout } from "../hooks/useCheckout";

const STEPS = [
  { id: "review", label: "Basket" },
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
];

const CONFETTI = ["#e0607a", "#a9ddce", "#f6dc74", "#c6b6ec", "#f2a7c6", "#bd5bd3"];

const inputClass = "min-w-0 w-full rounded-md border border-ink/20 bg-white px-3 py-2.5 transition hover:border-star/70 focus:border-star focus:outline-none focus:ring-2 focus:ring-star/20";
const labelClass = "grid gap-1.5 text-sm font-bold text-[#625768]";

function swatch(colors) {
  return `linear-gradient(135deg, ${colors?.[0]?.hex || "#f2b7c6"}, ${colors?.[1]?.hex || colors?.[0]?.hex || "#dff3ec"})`;
}

export default function CheckoutPage({ onNavigateHome }) {
  const { updateQuantity, removeItem } = useCart();
  const {
    items, subtotal, step, setStep,
    shipping, updateShipping, shippingValid,
    paymentMethod, setPaymentMethod,
    submitting, error, order, placeOrder,
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
          <SuccessPanel order={order} onFinish={onNavigateHome} />
        ) : (
          <div className="grid grid-cols-[1fr_23rem] items-start gap-10 pt-2 max-[900px]:grid-cols-1">
            <AnimatePresence mode="wait">
              {step === "review" && (
                <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <h1 className="mb-1 font-display text-4xl leading-none">Your basket</h1>
                  <p className="mb-6 text-sm font-bold text-[#6f6674]">Adjust quantities or remove items before you check out.</p>
                  <ItemList items={items} updateQuantity={updateQuantity} removeItem={removeItem} large />
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
                  <label className={labelClass}><span>Full name</span><input className={inputClass} required value={shipping.name} onChange={(event) => updateShipping("name", event.target.value)} /></label>
                  <label className={labelClass}><span>Email</span><input className={inputClass} type="email" required value={shipping.email} onChange={(event) => updateShipping("email", event.target.value)} /></label>
                  <label className={labelClass}><span>Address</span><input className={inputClass} required value={shipping.address} onChange={(event) => updateShipping("address", event.target.value)} /></label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={labelClass}><span>Postal code</span><input className={inputClass} required value={shipping.postalCode} onChange={(event) => updateShipping("postalCode", event.target.value)} /></label>
                    <label className={labelClass}><span>City</span><input className={inputClass} required value={shipping.city} onChange={(event) => updateShipping("city", event.target.value)} /></label>
                  </div>
                  <label className={labelClass}><span>Phone (optional)</span><input className={inputClass} value={shipping.phone} onChange={(event) => updateShipping("phone", event.target.value)} /></label>
                  <div className="mt-2 flex gap-3">
                    <button className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border border-ink bg-white px-5 py-3 font-extrabold text-ink transition hover:-translate-y-0.5 hover:bg-cream hover:text-wine" type="button" onClick={() => setStep("review")}>Back</button>
                    <button className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40" type="submit" disabled={!shippingValid}>Continue to payment</button>
                  </div>
                </motion.form>
              )}

              {step === "payment" && (
                <motion.div key="payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <h1 className="mb-1 font-display text-4xl leading-none">Payment</h1>
                  <p className="mb-4 mt-3 rounded-lg border border-star/30 bg-[#f9effb] px-3 py-2 text-sm font-bold text-[#6f4b7a]">This is a demo checkout &mdash; no real payment will be processed.</p>
                  <div className="grid gap-2.5" role="radiogroup" aria-label="Payment method">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        role="radio"
                        aria-checked={paymentMethod === method.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 text-left transition ${paymentMethod === method.id ? "border-ink bg-white shadow-[0_8px_20px_rgba(61,48,70,.1)]" : "border-ink/15 bg-white/60 hover:bg-cream"}`}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <span>
                          <b className="block">{method.label}</b>
                          <span className="block text-xs font-bold text-[#6f6674]">{method.hint}</span>
                        </span>
                        <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${paymentMethod === method.id ? "border-ink" : "border-ink/30"}`}>
                          {paymentMethod === method.id && <span className="size-2.5 rounded-full bg-ink" />}
                        </span>
                      </button>
                    ))}
                  </div>
                  {error && <p className="mt-4 rounded-md bg-[#ffe3e3] px-3 py-2 text-sm font-bold text-wine">{error}</p>}
                  <div className="mt-4 flex gap-3">
                    <button className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border border-ink bg-white px-5 py-3 font-extrabold text-ink transition hover:-translate-y-0.5 hover:bg-cream hover:text-wine disabled:cursor-not-allowed" type="button" onClick={() => setStep("shipping")} disabled={submitting}>Back</button>
                    <button className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink disabled:pointer-events-none disabled:cursor-wait disabled:opacity-60" type="button" onClick={placeOrder} disabled={submitting}>
                      {submitting ? "Placing order…" : "Place order (demo)"}
                    </button>
                  </div>
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

function ItemList({ items, updateQuantity, removeItem, large = false }) {
  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {items.map((line) => (
        <li className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-ink/10 bg-white ${large ? "p-4" : "p-3"}`} key={line.lineId}>
          <span
            className={`block shrink-0 rounded-md border border-ink/15 ${large ? "size-16" : "size-12"}`}
            style={{ backgroundImage: swatch(line.colors) }}
            aria-hidden="true"
          />
          <span className="min-w-0">
            <b className="block truncate">{line.title}</b>
            <span className="block text-xs font-bold text-[#6f6674]">{line.size} &middot; {formatPrice(line.price)}</span>
            <span className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-ink/20 bg-cream px-1.5 py-1">
              <button type="button" className="grid size-6 cursor-pointer place-items-center rounded-full text-sm font-extrabold transition hover:bg-white" onClick={() => updateQuantity(line.lineId, line.quantity - 1)} aria-label={`Decrease quantity of ${line.title}`}>&minus;</button>
              <span className="w-4 text-center text-xs font-extrabold" aria-live="polite">{line.quantity}</span>
              <button type="button" className="grid size-6 cursor-pointer place-items-center rounded-full text-sm font-extrabold transition hover:bg-white" onClick={() => updateQuantity(line.lineId, line.quantity + 1)} aria-label={`Increase quantity of ${line.title}`}>+</button>
            </span>
          </span>
          <span className="flex flex-col items-end gap-2 self-start">
            <button type="button" className="cursor-pointer rounded-full p-1.5 text-[#9a8fa0] transition hover:bg-cream hover:text-wine" onClick={() => removeItem(line.lineId)} aria-label={`Remove ${line.title} from basket`}>
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            {large && <span className="font-extrabold text-rose">{formatPrice(line.price * line.quantity)}</span>}
          </span>
        </li>
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
            style={{ backgroundImage: swatch(line.colors) }}
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

function SuccessPanel({ order, onFinish }) {
  if (!order) return null;
  return (
    <motion.div className="relative mx-auto max-w-md py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="pointer-events-none absolute inset-x-0 -top-4 flex justify-center gap-2 overflow-hidden">
        {CONFETTI.map((color, index) => (
          <motion.span
            key={color}
            className="block size-2.5 rounded-full"
            style={{ background: color }}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: [-10, 60 + (index % 3) * 20], opacity: [1, 0] }}
            transition={{ duration: 1.1, delay: index * 0.05, ease: "easeIn" }}
          />
        ))}
      </div>
      <motion.span
        className="mx-auto mb-4 grid size-16 place-items-center rounded-full border border-ink bg-mint text-2xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 16, delay: 0.1 }}
        aria-hidden="true"
      >
        ✓
      </motion.span>
      <h1 className="mb-2 font-display text-4xl leading-none">Order placed!</h1>
      <p className="m-0 text-sm font-bold text-[#6f6674]">Confirmation <span className="text-ink">{order.id}</span></p>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[#6f6674]">This was a demo checkout, so nothing was actually charged &mdash; but a note has been sent to Oda Knits.</p>
      <button className="mt-7 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-6 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink" type="button" onClick={onFinish}>
        Continue shopping
      </button>
    </motion.div>
  );
}
