import { AnimatePresence, motion } from "framer-motion";
import ApplePayButton from "./ApplePayButton";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { PAYMENT_METHODS, useCheckout } from "./useCheckout";

const CONFETTI = ["#e0607a", "#a9ddce", "#f6dc74", "#c6b6ec", "#f2a7c6", "#bd5bd3"];

const inputClass = "min-w-0 w-full rounded-md border border-ink/20 bg-white px-3 py-2.5 transition hover:border-star/70 focus:border-star focus:outline-none focus:ring-2 focus:ring-star/20";
const labelClass = "grid gap-1.5 text-sm font-bold text-[#625768]";

export default function CheckoutModal({ onClose }) {
  const { closeDrawer } = useCart();
  const {
    items, subtotal, step, setStep,
    shipping, updateShipping, shippingValid,
    paymentMethod, setPaymentMethod,
    submitting, error, order, placeOrder,
    payWithKlarna, payWithVipps, providers, realPayment,
  } = useCheckout();

  const finish = () => {
    closeDrawer();
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#241e29]/70 p-4 max-[620px]:items-end max-[620px]:p-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => step !== "success" && event.target === event.currentTarget && onClose()}
    >
      <motion.div
        className="relative flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-ink/20 bg-cream max-[620px]:h-[92svh] max-[620px]:max-h-[92svh] max-[620px]:rounded-t-2xl max-[620px]:rounded-b-none max-[620px]:border-x-0 max-[620px]:border-b-0"
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 330, damping: 30 }}
      >
        {step !== "success" && (
          <button className="absolute top-3 right-3 z-20 flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-ink text-cream hover:bg-rose hover:text-ink" onClick={onClose} type="button" aria-label="Close checkout">
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" /></svg>
          </button>
        )}

        <div className="overflow-y-auto px-7 py-8 max-[620px]:px-5 max-[620px]:py-7">
          {step !== "success" && (
            <>
              <p className="mb-1 text-xs font-extrabold uppercase text-wine">Mock checkout</p>
              <h2 className="mb-6 font-display text-4xl leading-none max-[620px]:text-3xl">
                {step === "review" ? "Your order" : step === "shipping" ? "Shipping details" : "Payment"}
              </h2>
            </>
          )}

          <AnimatePresence mode="wait">
            {step === "review" && (
              <motion.div key="review" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                <ul className="m-0 grid list-none gap-2.5 p-0">
                  {items.map((line) => (
                    <li className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 bg-white px-3 py-2.5" key={line.lineId}>
                      <span className="min-w-0">
                        <b className="block truncate">{line.title}</b>
                        <span className="block text-xs font-bold text-[#6f6674]">{line.size} &middot; Qty {line.quantity}</span>
                      </span>
                      <span className="shrink-0 font-extrabold text-rose">{formatPrice(line.price * line.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between border-t border-ink/15 pt-4 text-lg">
                  <span className="font-bold">Subtotal</span>
                  <span className="font-extrabold">{formatPrice(subtotal)}</span>
                </div>
                <button className="mt-6 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40" type="button" disabled={items.length === 0} onClick={() => setStep("shipping")}>
                  Continue to shipping
                </button>
              </motion.div>
            )}

            {step === "shipping" && (
              <motion.form
                key="shipping"
                className="grid gap-4"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={(event) => { event.preventDefault(); if (shippingValid) setStep("payment"); }}
              >
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
              <motion.div key="payment" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                {providers.applePay && (
                  <ApplePayButton items={items} subtotal={subtotal} onPaid={() => placeOrder("Apple Pay")} />
                )}
                {providers.klarna && (
                  <button
                    type="button"
                    className="mb-3 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border border-[#0a0a0a] bg-[#ffb3c7] px-5 py-3 font-extrabold text-ink transition hover:-translate-y-0.5 hover:brightness-95 disabled:pointer-events-none disabled:cursor-wait disabled:opacity-60"
                    onClick={payWithKlarna}
                    disabled={submitting}
                  >
                    Pay with Klarna
                  </button>
                )}
                {providers.vipps && (
                  <button
                    type="button"
                    className="mb-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border border-[#ff5b24] bg-[#ff5b24] px-5 py-3 font-extrabold text-white transition hover:-translate-y-0.5 hover:brightness-95 disabled:pointer-events-none disabled:cursor-wait disabled:opacity-60"
                    onClick={payWithVipps}
                    disabled={submitting}
                  >
                    Pay with Vipps
                  </button>
                )}
                <p className="mb-4 rounded-lg border border-star/30 bg-[#f9effb] px-3 py-2 text-sm font-bold text-[#6f4b7a]">Card below is a demo &mdash; no real payment will be processed.</p>
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
                <div className="mt-6 flex items-center justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-extrabold">{formatPrice(subtotal)}</span>
                </div>
                <div className="mt-4 flex gap-3">
                  <button className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border border-ink bg-white px-5 py-3 font-extrabold text-ink transition hover:-translate-y-0.5 hover:bg-cream hover:text-wine disabled:cursor-not-allowed" type="button" onClick={() => setStep("shipping")} disabled={submitting}>Back</button>
                  <button className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink disabled:pointer-events-none disabled:cursor-wait disabled:opacity-60" type="button" onClick={() => placeOrder()} disabled={submitting}>
                    {submitting ? "Placing order…" : "Place order (demo)"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === "success" && order && (
              <motion.div key="success" className="relative py-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
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
                <h2 className="mb-2 font-display text-4xl leading-none max-[620px]:text-3xl">Order placed!</h2>
                <p className="m-0 text-sm font-bold text-[#6f6674]">Confirmation <span className="text-ink">{order.id}</span></p>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[#6f6674]">
                  {realPayment
                    ? `Your payment was processed with ${realPayment}. A note has been sent to Oda Knits.`
                    : "This was a demo checkout, so nothing was actually charged — but a note has been sent to Oda Knits."}
                </p>
                <button className="mt-7 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-6 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink" type="button" onClick={finish}>
                  Continue shopping
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
