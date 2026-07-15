import ApplePayButton from "./ApplePayButton";
import { PAYMENT_METHODS } from "./useCheckout";

export default function PaymentMethodFields({
  items, subtotal, providers, submitting, error,
  paymentMethod, setPaymentMethod, payWithKlarna, payWithVipps, placeOrder, onBack,
  summary,
}) {
  return (
    <>
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
          className="mb-3 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border border-[#ff5b24] bg-[#ff5b24] px-5 py-3 font-extrabold text-white transition hover:-translate-y-0.5 hover:brightness-95 disabled:pointer-events-none disabled:cursor-wait disabled:opacity-60"
          onClick={payWithVipps}
          disabled={submitting}
        >
          Pay with Vipps
        </button>
      )}
      <p className="mb-4 mt-3 rounded-lg border border-star/30 bg-[#f9effb] px-3 py-2 text-sm font-bold text-[#6f4b7a]">Card below is a demo &mdash; no real payment will be processed.</p>
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
      {summary}
      <div className="mt-4 flex gap-3">
        <button className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border border-ink bg-white px-5 py-3 font-extrabold text-ink transition hover:-translate-y-0.5 hover:bg-cream hover:text-wine disabled:cursor-not-allowed" type="button" onClick={onBack} disabled={submitting}>Back</button>
        <button className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink disabled:pointer-events-none disabled:cursor-wait disabled:opacity-60" type="button" onClick={() => placeOrder()} disabled={submitting}>
          {submitting ? "Placing order…" : "Place order (demo)"}
        </button>
      </div>
    </>
  );
}
