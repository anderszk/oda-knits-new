import type { ShippingFormState } from "@/models/order";

const inputClass = "min-w-0 w-full rounded-md border border-ink/20 bg-white px-3 py-2.5 text-base transition hover:border-star/70 focus:border-star focus:outline-none focus:ring-2 focus:ring-star/20";
const labelClass = "grid gap-1.5 text-sm font-bold text-[#625768]";

interface ShippingFieldsProps {
  shipping: ShippingFormState;
  updateShipping: (field: keyof ShippingFormState, value: string) => void;
  shippingValid: boolean;
  onBack: () => void;
}

export default function ShippingFields({ shipping, updateShipping, shippingValid, onBack }: ShippingFieldsProps) {
  return (
    <>
      <label className={labelClass}><span>Full name</span><input className={inputClass} required value={shipping.name} onChange={(event) => updateShipping("name", event.target.value)} /></label>
      <label className={labelClass}><span>Email</span><input className={inputClass} type="email" required value={shipping.email} onChange={(event) => updateShipping("email", event.target.value)} /></label>
      <label className={labelClass}><span>Address</span><input className={inputClass} required value={shipping.address} onChange={(event) => updateShipping("address", event.target.value)} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}><span>Postal code</span><input className={inputClass} required value={shipping.postalCode} onChange={(event) => updateShipping("postalCode", event.target.value)} /></label>
        <label className={labelClass}><span>City</span><input className={inputClass} required value={shipping.city} onChange={(event) => updateShipping("city", event.target.value)} /></label>
      </div>
      <label className={labelClass}><span>Phone (optional)</span><input className={inputClass} value={shipping.phone} onChange={(event) => updateShipping("phone", event.target.value)} /></label>
      <div className="mt-2 flex gap-3">
        <button className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border border-ink bg-white px-5 py-3 font-extrabold text-ink transition hover:-translate-y-0.5 hover:bg-cream hover:text-wine" type="button" onClick={onBack}>Back</button>
        <button className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40" type="submit" disabled={!shippingValid}>Continue to payment</button>
      </div>
    </>
  );
}
