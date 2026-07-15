import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiClient } from "@/api";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import ColorSwatchList from "@/components/shared/ColorSwatchList";
import ImageCarouselNav from "@/components/shared/ImageCarouselNav";
import ImageThumbnailStrip from "@/components/shared/ImageThumbnailStrip";
import ModalShell from "@/components/shared/ModalShell";
import { swatchStyle } from "@/components/shared/swatchStyle";
import { useDismissableModal } from "@/components/shared/useDismissableModal";
import { isLowStock, type Product } from "@/models/product";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onBuyNow: () => void;
}

export default function ProductModal({ product, onClose, onBuyNow }: ProductModalProps) {
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const colors = product.colors || [];
  const images = product.images?.length ? product.images : [product.image].filter(Boolean);
  const lowStock = isLowStock(product.stock);

  const {
    closeButtonRef, modalRef, imageIndex, setImageIndex, changeImage,
    closingBySwipe, mobile, dragControls, startDrag, handleDragEnd,
    onTouchStart, onTouchEnd,
  } = useDismissableModal({ resetKey: product.id, imageCount: images.length, onClose });

  useEffect(() => {
    setSize(product.sizes?.[0] || "");
    setQuantity(1);
    setAdded(false);
  }, [product.id]);

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
    <ModalShell
      labelledBy="product-title"
      closeLabel="Close product"
      modalRef={modalRef}
      closeButtonRef={closeButtonRef}
      mobile={mobile}
      dragControls={dragControls}
      handleDragEnd={handleDragEnd}
      closingBySwipe={closingBySwipe}
      startDrag={startDrag}
      onClose={onClose}
    >
      <div
        className="relative flex min-h-full items-center justify-center overflow-hidden max-[620px]:h-[30svh] max-[620px]:min-h-[13rem]"
        style={images.length ? undefined : swatchStyle(colors)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.length ? (
          <AnimatePresence mode="wait">
            <motion.img
              className="absolute inset-0 size-full object-cover"
              key={images[imageIndex]}
              src={apiClient.assetUrl(images[imageIndex])}
              alt={`${product.title}, view ${imageIndex + 1} of ${images.length}`}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            />
          </AnimatePresence>
        ) : (
          <span className="select-none font-display text-[7rem] leading-none text-white/25 max-[900px]:text-[5.5rem]" aria-hidden="true">*</span>
        )}
        {product.badge && <span className="absolute top-3 left-3 rounded-full border border-ink bg-cream px-2 py-1 text-[0.72rem] font-extrabold">{product.badge}</span>}
        {lowStock && <span className="absolute bottom-3 left-3 rounded-full border border-ink bg-[#fff3d6] px-2 py-1 text-[0.72rem] font-extrabold">Only {product.stock} left</span>}
        <ImageCarouselNav imageIndex={imageIndex} imageCount={images.length} onChange={changeImage} />
      </div>
      <div className="px-10 pt-14 pb-10 max-[900px]:px-6 max-[900px]:pt-14 max-[900px]:pb-6 max-[620px]:overflow-y-auto max-[620px]:px-4 max-[620px]:pt-0 max-[620px]:pb-8">
        <div className="max-[620px]:sticky max-[620px]:top-0 max-[620px]:z-10 max-[620px]:-mx-4 max-[620px]:border-b max-[620px]:border-ink/10 max-[620px]:bg-cream max-[620px]:px-4 max-[620px]:pt-5 max-[620px]:pb-4">
          <p className="mb-3 text-xs font-extrabold uppercase text-wine max-[620px]:mb-2">{product.category}</p>
          <h2 className="mb-2 font-display text-[3.1rem] leading-[0.96] max-[900px]:text-[2.6rem] max-[620px]:mb-1 max-[620px]:pr-8 max-[620px]:text-[2.1rem]" id="product-title">{product.title}</h2>
          <p className="m-0 text-xl font-extrabold text-rose">{formatPrice(product.price)}</p>
        </div>
        <p className="mt-4 text-[1.02rem] leading-relaxed text-[#665e6b] max-[620px]:mt-3 max-[620px]:text-[0.98rem]">{product.description}</p>

        <ColorSwatchList colors={colors} className="mt-5 flex flex-wrap gap-2" label="Available colors" />

        <ImageThumbnailStrip
          images={images}
          activeIndex={imageIndex}
          onSelect={setImageIndex}
          className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          label="Choose product image"
        />

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
    </ModalShell>
  );
}
