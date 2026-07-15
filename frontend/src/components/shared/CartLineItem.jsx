import { formatPrice } from "@/lib/format";
import { swatchGradient } from "@/components/shared/swatchStyle";

function RemoveLineButton({ title, onRemove, standalone }) {
  return (
    <button
      type="button"
      className={`cursor-pointer rounded-full p-1.5 text-[#9a8fa0] transition hover:bg-cream hover:text-wine ${standalone ? "self-start justify-self-end" : ""}`}
      onClick={onRemove}
      aria-label={`Remove ${title} from basket`}
    >
      <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    </button>
  );
}

export default function CartLineItem({ line, onDecrease, onIncrease, onRemove, large = false }) {
  return (
    <li className={`grid ${large ? "grid-cols-[auto_1fr_auto] p-4" : "grid-cols-[3.25rem_1fr_auto] p-3"} items-center gap-3 rounded-xl border border-ink/10 bg-white`}>
      <span
        className={`block shrink-0 rounded-md border border-ink/15 ${large ? "size-16" : "size-13"}`}
        style={{ backgroundImage: swatchGradient(line.colors) }}
        aria-hidden="true"
      />
      <span className="min-w-0">
        <b className="block truncate">{line.title}</b>
        <span className="block text-xs font-bold text-[#6f6674]">{line.size} &middot; {formatPrice(line.price)}</span>
        <span className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-ink/20 bg-cream px-1.5 py-1">
          <button type="button" className="grid size-6 cursor-pointer place-items-center rounded-full text-sm font-extrabold transition hover:bg-white" onClick={onDecrease} aria-label={`Decrease quantity of ${line.title}`}>&minus;</button>
          <span className="w-4 text-center text-xs font-extrabold" aria-live="polite">{line.quantity}</span>
          <button type="button" className="grid size-6 cursor-pointer place-items-center rounded-full text-sm font-extrabold transition hover:bg-white" onClick={onIncrease} aria-label={`Increase quantity of ${line.title}`}>+</button>
        </span>
      </span>
      {large ? (
        <span className="flex flex-col items-end gap-2 self-start">
          <RemoveLineButton title={line.title} onRemove={onRemove} />
          <span className="font-extrabold text-rose">{formatPrice(line.price * line.quantity)}</span>
        </span>
      ) : (
        <RemoveLineButton title={line.title} onRemove={onRemove} standalone />
      )}
    </li>
  );
}
