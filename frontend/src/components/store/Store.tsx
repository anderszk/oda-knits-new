import { useEffect, useState, type MouseEvent, type PointerEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { apiClient } from "@/api";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import ScrollReveal, { useMobileMotion, useScrollReveal } from "@/components/shared/ScrollReveal";
import { swatchStyle } from "@/components/shared/swatchStyle";
import { isLowStock, type Product } from "@/models/product";
import StoreScene from "./StoreScene";

function useColumnCount(): number {
  const [columns, setColumns] = useState(4);
  useEffect(() => {
    const queries = [
      window.matchMedia("(max-width: 460px)"),
      window.matchMedia("(max-width: 750px)"),
      window.matchMedia("(max-width: 1100px)"),
    ];
    const update = () => {
      if (queries[0].matches) setColumns(1);
      else if (queries[1].matches) setColumns(2);
      else if (queries[2].matches) setColumns(3);
      else setColumns(4);
    };
    update();
    queries.forEach((query) => query.addEventListener("change", update));
    return () => queries.forEach((query) => query.removeEventListener("change", update));
  }, []);
  return columns;
}

interface StoreProps {
  products: Product[];
  onSelect: (product: Product) => void;
}

export default function Store({ products, onSelect }: StoreProps) {
  const columns = useColumnCount();
  const singleColumn = columns === 1;
  return (
    <section className="bg-flax px-[clamp(1rem,4vw,4rem)] py-24 max-[620px]:px-4 max-[620px]:py-16" id="store">
      <div className="grid grid-cols-[1.1fr_1fr] items-start gap-8 max-[900px]:grid-cols-1 max-[900px]:mb-10">
        <ScrollReveal>
          <p className="mb-3 text-xs font-extrabold uppercase text-wine">The little shop</p>
          <h2 className="m-0 font-display text-[4.2rem] leading-[0.96] max-[900px]:text-5xl max-[620px]:text-[2.5rem] max-[380px]:text-[2.25rem]">Take a piece home</h2>
          <p className="mt-4 max-w-md leading-relaxed text-[#6f6674]">Small batch knits, ready to ship. Pick a size, add to your basket, and check out in a minute.</p>
        </ScrollReveal>
        <div className="-mt-20 h-[26rem] max-[1050px]:-mt-10 max-[1050px]:h-[20rem] max-[900px]:hidden">
          <StoreScene />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-x-5 gap-y-12 -mt-12 max-[1100px]:grid-cols-3 max-[900px]:mt-0 max-[750px]:grid-cols-2 max-[460px]:grid-cols-1 max-[460px]:gap-y-5">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} columns={columns} onSelect={onSelect} stagger={!singleColumn && index % 2 === 1} />
        ))}
      </div>
    </section>
  );
}

interface ProductCardProps {
  product: Product;
  index: number;
  columns: number;
  onSelect: (product: Product) => void;
  stagger: boolean;
}

function ProductCard({ product, index, columns, onSelect, stagger }: ProductCardProps) {
  const { addItem, openDrawer } = useCart();
  const [added, setAdded] = useState(false);
  const reduceMotion = useReducedMotion();
  const mobile = useMobileMotion();
  const tiltEnabled = !reduceMotion && !mobile;
  const lowStock = isLowStock(product.stock);
  const baseOffset = stagger ? 28 : 0;

  const column = index % columns;
  const center = (columns - 1) / 2;
  const dirX = columns > 1 ? (column - center) * 18 : 0;
  const dirRotate = dirX ? Math.sign(dirX) * 1.4 : (index % 2 ? 1 : -1) * 0.8;
  const { ref: cardRef, style: revealStyle } = useScrollReveal<HTMLDivElement>({
    from: { x: dirX, y: 46 },
    rotate: dirRotate,
    scale: 0.94,
  });

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const springConfig = { stiffness: 220, damping: 22, mass: 0.4 };
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-6, 6]), springConfig);
  const glowX = useTransform(pointerX, [0, 1], ["12%", "88%"]);
  const glowY = useTransform(pointerY, [0, 1], ["12%", "88%"]);
  const glow = useTransform([glowX, glowY], ([x, y]: string[]) => `radial-gradient(180px circle at ${x} ${y}, rgba(255,255,255,.55), transparent 60%)`);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!tiltEnabled || !cardRef.current) return;
    const bounds = cardRef.current.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width);
    pointerY.set((event.clientY - bounds.top) / bounds.height);
  };
  const resetPointer = () => {
    pointerX.set(0.5);
    pointerY.set(0.5);
  };

  const zero = useMotionValue(0);
  const hoverLift = useMotionValue(0);
  const liftedY = useTransform(
    [revealStyle?.y ?? zero, hoverLift],
    ([scrollY, lift]: number[]) => scrollY + baseOffset + lift,
  );
  const liftIn = () => tiltEnabled && animate(hoverLift, -6, { type: "spring", stiffness: 320, damping: 24 });
  const liftOut = () => tiltEnabled && animate(hoverLift, 0, { type: "spring", stiffness: 320, damping: 24 });

  const quickAdd = (event: MouseEvent) => {
    event.stopPropagation();
    addItem(product, product.sizes?.[0] || "One size", 1);
    setAdded(true);
    openDrawer();
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <motion.div
      ref={cardRef}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-ink/15 bg-white shadow-[0_10px_26px_rgba(61,48,70,.08)] transition-shadow duration-300 hover:shadow-[0_22px_44px_rgba(61,48,70,.16)]"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      onHoverStart={liftIn}
      onHoverEnd={liftOut}
      style={{
        transformPerspective: 900,
        rotateX: tiltEnabled ? rotateX : 0,
        rotateY: tiltEnabled ? rotateY : 0,
        opacity: revealStyle?.opacity,
        x: revealStyle?.x,
        y: liftedY,
        rotate: revealStyle?.rotate,
        scale: revealStyle?.scale,
      }}
      whileTap={{ scale: 0.985 }}
    >
      <button
        type="button"
        className="absolute inset-0 z-0 cursor-pointer rounded-lg focus-visible:outline-[3px] focus-visible:outline-offset-3 focus-visible:outline-rose"
        onClick={() => onSelect(product)}
        aria-label={`View ${product.title}`}
      />
      <div className="pointer-events-none relative aspect-square w-full overflow-hidden border-b border-ink/10" style={product.image ? undefined : swatchStyle(product.colors)}>
        {product.image ? (
          <img className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.045]" src={apiClient.assetUrl(product.image)} alt="" />
        ) : (
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 select-none font-display text-[5rem] leading-none text-white/25 transition-transform duration-500 group-hover:scale-110" aria-hidden="true">*</span>
        )}
        {tiltEnabled && (
          <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glow }} />
        )}
        {product.image && product.colors?.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1" aria-hidden="true">
            {product.colors.map((color) => (
              <i className="block size-3 rounded-full border border-white/70 shadow-[0_1px_3px_rgba(0,0,0,.3)]" key={color.name} style={{ background: color.hex }} />
            ))}
          </div>
        )}
        {product.badge && <span className="absolute top-3 left-3 rounded-full border border-ink/15 bg-cream px-2 py-1 text-[0.68rem] font-extrabold">{product.badge}</span>}
        {lowStock && <span className="absolute top-3 right-3 rounded-full border border-ink/15 bg-[#fff3d6] px-2 py-1 text-[0.68rem] font-extrabold">{product.stock} left</span>}
        <motion.button
          type="button"
          className="pointer-events-auto absolute right-3 bottom-3 z-10 grid size-10 cursor-pointer place-items-center rounded-full border border-ink/15 bg-cream text-ink shadow-[0_6px_16px_rgba(61,48,70,.16)] transition-colors hover:bg-rose hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          onClick={quickAdd}
          aria-label={`Add ${product.title} to basket`}
          whileHover={reduceMotion ? undefined : { scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
        >
          {added ? (
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : (
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
          )}
        </motion.button>
      </div>
      <div className="pointer-events-none relative flex flex-1 flex-col gap-1 p-4">
        <p className="m-0 text-[0.68rem] font-extrabold uppercase text-wine">{product.category}</p>
        <h3 className="m-0 truncate font-display text-xl leading-tight">{product.title}</h3>
        <p className="m-0 mt-1 text-sm font-extrabold text-rose">{formatPrice(product.price)}</p>
      </div>
    </motion.div>
  );
}
