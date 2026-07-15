import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export default function CartDrawer({ onCheckout }) {
  const { items, subtotal, drawerOpen, closeDrawer, updateQuantity, removeItem } = useCart();

  return (
    <AnimatePresence>
      {drawerOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end backdrop-blur-sm"
          style={{ backgroundColor: "rgba(48, 41, 54, 0.5)" }}
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && closeDrawer()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.aside
            className="flex h-full w-full max-w-md flex-col overflow-hidden bg-cream shadow-[-20px_0_50px_rgba(61,48,70,.24)]"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping basket"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
              <h2 className="m-0 font-display text-2xl">Your basket<span className="text-star">*</span></h2>
              <button className="grid size-9 cursor-pointer place-items-center rounded-full border border-ink bg-ink text-cream transition hover:bg-rose hover:text-ink focus-visible:bg-rose focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" type="button" onClick={closeDrawer} aria-label="Close basket">
                <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <span className="font-display text-5xl text-star" aria-hidden="true">*</span>
                <p className="m-0 font-bold text-[#6f6674]">Your basket is empty. Time to find something cozy.</p>
                <a className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full border border-ink bg-ink px-4 py-2.5 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink" href="#store" onClick={closeDrawer}>Browse the shop</a>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <ul className="m-0 grid list-none gap-3 p-0">
                    {items.map((line) => (
                      <li className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 rounded-xl border border-ink/10 bg-white p-3" key={line.lineId}>
                        <span
                          className="block size-13 shrink-0 rounded-md border border-ink/15"
                          style={{ backgroundImage: `linear-gradient(135deg, ${(line.colors?.[0]?.hex) || "#f2b7c6"}, ${(line.colors?.[1]?.hex) || (line.colors?.[0]?.hex) || "#dff3ec"})` }}
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
                        <button type="button" className="cursor-pointer self-start justify-self-end rounded-full p-1.5 text-[#9a8fa0] transition hover:bg-cream hover:text-wine" onClick={() => removeItem(line.lineId)} aria-label={`Remove ${line.title} from basket`}>
                          <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-ink/10 bg-cream px-5 py-4">
                  <div className="mb-3 flex items-center justify-between text-sm font-bold text-[#6f6674]">
                    <span>Subtotal</span>
                    <span className="text-lg font-extrabold text-ink">{formatPrice(subtotal)}</span>
                  </div>
                  <button className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink" type="button" onClick={() => { closeDrawer(); onCheckout(); }}>
                    Checkout
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
