import type { ReactNode } from "react";
import ApplePayButton from "./ApplePayButton";
import CardPaymentField from "./CardPaymentField";
import klarnaBadge from "@/img/payment-logos/klarna-badge.svg";
import vippsWordmark from "@/img/payment-logos/vipps-wordmark.svg";
import type { CartLine } from "@/models/cartLine";

interface PaymentProviders {
  card: boolean;
  applePay: boolean;
  klarna: boolean;
  vipps: boolean;
}

interface PaymentMethodFieldsProps {
  items: CartLine[];
  subtotal: number;
  providers: PaymentProviders;
  submitting: boolean;
  error: string;
  payWithKlarna: () => void;
  payWithVipps: () => void;
  placeOrder: (paymentMethod: string) => void;
  onBack: () => void;
  summary?: ReactNode;
}

export default function PaymentMethodFields({
  items, subtotal, providers, submitting, error,
  payWithKlarna, payWithVipps, placeOrder, onBack,
  summary,
}: PaymentMethodFieldsProps) {
  const hasExpressOptions = providers.applePay || providers.klarna || providers.vipps;

  return (
    <>
      {hasExpressOptions && (
        <div className="mb-6 grid gap-2">
          {providers.applePay && (
            <ApplePayButton items={items} subtotal={subtotal} onPaid={() => placeOrder("Apple Pay")} />
          )}
          {providers.klarna && (
            <button
              type="button"
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-4 text-sm font-bold text-ink transition hover:border-ink/30 hover:bg-cream disabled:pointer-events-none disabled:cursor-wait disabled:opacity-60"
              onClick={payWithKlarna}
              disabled={submitting}
            >
              Pay with
              <img src={klarnaBadge} alt="Klarna" className="h-4 w-auto" />
            </button>
          )}
          {providers.vipps && (
            <button
              type="button"
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-4 text-sm font-bold text-ink transition hover:border-ink/30 hover:bg-cream disabled:pointer-events-none disabled:cursor-wait disabled:opacity-60"
              onClick={payWithVipps}
              disabled={submitting}
            >
              Pay with
              <img src={vippsWordmark} alt="Vipps" className="h-4 w-auto" />
            </button>
          )}
        </div>
      )}
      {hasExpressOptions && providers.card && (
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-ink/15" aria-hidden="true" />
          <span className="text-xs font-extrabold uppercase tracking-wide text-[#8a8191]">Or pay by card</span>
          <span className="h-px flex-1 bg-ink/15" aria-hidden="true" />
        </div>
      )}
      {providers.card && (
        <CardPaymentField items={items} subtotal={subtotal} onPaid={() => placeOrder("Card")} />
      )}
      {error && <p className="mt-4 rounded-md bg-[#ffe3e3] px-3 py-2 text-sm font-bold text-wine">{error}</p>}
      {summary}
      <div className="mt-4 flex gap-3">
        <button className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border border-ink bg-white px-5 py-3 font-extrabold text-ink transition hover:-translate-y-0.5 hover:bg-cream hover:text-wine disabled:cursor-not-allowed" type="button" onClick={onBack} disabled={submitting}>Back</button>
      </div>
    </>
  );
}
