import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/format";

function swatchStyle(colors) {
  const stops = (colors?.length ? colors : [{ hex: "#f2b7c6" }, { hex: "#dff3ec" }]).map((color) => color.hex);
  const gradient = stops.length > 1 ? `linear-gradient(135deg, ${stops.join(", ")})` : `linear-gradient(135deg, ${stops[0]}, ${stops[0]})`;
  return {
    backgroundImage: `${gradient}, repeating-linear-gradient(45deg, rgba(255,255,255,.22) 0 2px, transparent 2px 10px)`,
  };
}

export default function ProductModal({ product, onClose, onBuyNow }) {
  const closeButton = useRef(null);
  const modal = useRef(null);
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const colors = product.colors || [];
  const lowStock = typeof product.stock === "number" && product.stock <= 3;

  useEffect(() => {
    setSize(product.sizes?.[0] || "");
    setQuantity(1);
    setAdded(false);
  }, [product.id]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const focusable = [...(modal.current?.querySelectorAll("button, input") || [])];
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKeyDown);
    closeButton.current?.focus();
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const handleAddToBasket = () => {
    addItem(product, size, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const handleBuyNow = () => {
    addItem(product, size, quantity);
    onBuyNow();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#241e29]/70 p-4 max-[620px]:items-end max-[620px]:p-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        ref={modal}
        className="relative grid max-h-[min(86vh,760px)] w-full max-w-[960px] grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] overflow-auto rounded-lg border border-ink/20 bg-cream max-[900px]:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] max-[620px]:h-[94svh] max-[620px]:max-h-[94svh] max-[620px]:grid-cols-1 max-[620px]:grid-rows-[auto_minmax(0,1fr)] max-[620px]:overflow-hidden max-[620px]:rounded-t-2xl max-[620px]:rounded-b-none max-[620px]:border-x-0 max-[620px]:border-b-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-title"
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 330, damping: 30 }}
      >
        <span className="absolute top-2 left-1/2 z-20 hidden h-1 w-12 -translate-x-1/2 rounded-full bg-ink/25 max-[620px]:block" aria-hidden="true" />
        <button ref={closeButton} className="absolute top-3 right-3 z-20 flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-ink text-cream hover:bg-rose hover:text-ink focus-visible:bg-rose focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-cream max-[620px]:top-4 max-[620px]:size-7" onClick={onClose} aria-label="Close product" title="Close">
          <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
          </svg>
        </button>
        <div className="relative flex min-h-full items-center justify-center overflow-hidden max-[620px]:h-[30svh] max-[620px]:min-h-[13rem]" style={swatchStyle(colors)}>
          <span className="select-none font-display text-[7rem] leading-none text-white/25 max-[900px]:text-[5.5rem]" aria-hidden="true">*</span>
          {product.badge && <span className="absolute top-3 left-3 rounded-full border border-ink bg-cream px-2 py-1 text-[0.72rem] font-extrabold">{product.badge}</span>}
          {lowStock && <span className="absolute bottom-3 left-3 rounded-full border border-ink bg-[#fff3d6] px-2 py-1 text-[0.72rem] font-extrabold">Only {product.stock} left</span>}
        </div>
        <div className="px-10 pt-14 pb-10 max-[900px]:px-6 max-[900px]:pt-14 max-[900px]:pb-6 max-[620px]:overflow-y-auto max-[620px]:px-4 max-[620px]:pt-0 max-[620px]:pb-8">
          <div className="max-[620px]:sticky max-[620px]:top-0 max-[620px]:z-10 max-[620px]:-mx-4 max-[620px]:border-b max-[620px]:border-ink/10 max-[620px]:bg-cream max-[620px]:px-4 max-[620px]:pt-5 max-[620px]:pb-4">
            <p className="mb-3 text-xs font-extrabold uppercase text-wine max-[620px]:mb-2">{product.category}</p>
            <h2 className="mb-2 font-display text-[3.1rem] leading-[0.96] max-[900px]:text-[2.6rem] max-[620px]:mb-1 max-[620px]:pr-8 max-[620px]:text-[2.1rem]" id="product-title">{product.title}</h2>
            <p className="m-0 text-xl font-extrabold text-rose">{formatPrice(product.price)}</p>
          </div>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-[#665e6b] max-[620px]:mt-3 max-[620px]:text-[0.98rem]">{product.description}</p>

          {colors.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2" aria-label="Available colors">
              {colors.map((color) => (
                <span className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-2 py-1 text-xs font-bold" key={color.name}>
                  <i className="size-4 rounded-full border border-ink/20" style={{ background: color.hex }} />{color.name}
                </span>
              ))}
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-extrabold uppercase text-wine">Size</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Select size">
                {product.sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`cursor-pointer rounded-full border px-3.5 py-2 text-sm font-extrabold transition ${size === option ? "border-ink bg-ink text-cream" : "border-ink/25 bg-white hover:-translate-y-0.5 hover:bg-cream hover:text-wine"}`}
                    aria-pressed={size === option}
                    onClick={() => setSize(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="mb-2 text-xs font-extrabold uppercase text-wine">Quantity</p>
            <div className="inline-flex items-center gap-3 rounded-full border border-ink/20 bg-white px-2 py-1.5">
              <button type="button" className="grid size-8 cursor-pointer place-items-center rounded-full text-lg font-extrabold transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-30" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label="Decrease quantity">&minus;</button>
              <span className="w-6 text-center text-sm font-extrabold" aria-live="polite">{quantity}</span>
              <button type="button" className="grid size-8 cursor-pointer place-items-center rounded-full text-lg font-extrabold transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-30" onClick={() => setQuantity((value) => Math.min(10, value + 1))} disabled={quantity >= 10} aria-label="Increase quantity">+</button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <motion.button
              type="button"
              className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border border-ink bg-white px-5 py-3 font-extrabold text-ink transition hover:-translate-y-0.5 hover:bg-cream hover:text-wine focus-visible:-translate-y-0.5 focus-visible:bg-cream focus-visible:text-wine"
              onClick={handleAddToBasket}
              whileTap={{ scale: 0.97 }}
            >
              {added ? "Added ✓" : "Add to basket"}
            </motion.button>
            <motion.button
              type="button"
              className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink focus-visible:-translate-y-0.5 focus-visible:bg-rose focus-visible:text-ink"
              onClick={handleBuyNow}
              whileTap={{ scale: 0.97 }}
            >
              Buy now
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
