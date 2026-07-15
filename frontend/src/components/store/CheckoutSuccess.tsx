import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { OrderResponse } from "@/models/order";

export const CONFETTI = ["#e0607a", "#a9ddce", "#f6dc74", "#c6b6ec", "#f2a7c6", "#bd5bd3"];

interface CheckoutSuccessProps {
  order: OrderResponse | null;
  onFinish: () => void;
  realPayment: string;
  children: ReactNode;
}

export default function CheckoutSuccess({ order, onFinish, realPayment, children }: CheckoutSuccessProps) {
  if (!order) return null;
  return (
    <>
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
      {children}
      <p className="m-0 text-sm font-bold text-[#6f6674]">Confirmation <span className="text-ink">{order.id}</span></p>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[#6f6674]">
        Your payment was processed with {realPayment}. A note has been sent to Oda Knits.
      </p>
      <button className="mt-7 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-ink bg-ink px-6 py-3 font-extrabold text-cream transition hover:-translate-y-0.5 hover:bg-rose hover:text-ink" type="button" onClick={onFinish}>
        Continue shopping
      </button>
    </>
  );
}
