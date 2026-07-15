import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import CheckoutSuccess from "./CheckoutSuccess";
import PaymentMethodFields from "./PaymentMethodFields";
import ShippingFields from "./ShippingFields";
import { useCheckout } from "./useCheckout";

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
                <ShippingFields
                  shipping={shipping}
                  updateShipping={updateShipping}
                  shippingValid={shippingValid}
                  onBack={() => setStep("review")}
                />
              </motion.form>
            )}

            {step === "payment" && (
              <motion.div key="payment" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
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
                  summary={
                    <div className="mt-6 flex items-center justify-between text-lg">
                      <span className="font-bold">Total</span>
                      <span className="font-extrabold">{formatPrice(subtotal)}</span>
                    </div>
                  }
                />
              </motion.div>
            )}

            {step === "success" && order && (
              <motion.div key="success" className="relative py-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                <CheckoutSuccess order={order} onFinish={finish} realPayment={realPayment}>
                  <h2 className="mb-2 font-display text-4xl leading-none max-[620px]:text-3xl">Order placed!</h2>
                </CheckoutSuccess>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
