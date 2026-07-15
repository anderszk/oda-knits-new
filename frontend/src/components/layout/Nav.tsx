import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";

function CartButton({ className = "" }: { className?: string }) {
  const { count, toggleDrawer } = useCart();
  return (
    <button
      className={`relative grid size-10 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ink transition hover:-translate-y-0.5 hover:text-wine focus-visible:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
      type="button"
      onClick={toggleDrawer}
      aria-label={`Open basket, ${count} item${count === 1 ? "" : "s"}`}
    >
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 9h14l-1.3 9.3a2 2 0 0 1-2 1.7H8.3a2 2 0 0 1-2-1.7L5 9Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M7 9 5.5 5M17 9l1.5-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7.3 13.2h9.4M7.9 16.6h8.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            className="absolute -top-1.5 -right-1.5 grid min-w-[1.15rem] place-items-center rounded-full border border-cream bg-rose px-1 py-px text-[0.65rem] font-extrabold text-ink"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-4 border-b border-ink/10 bg-cream/80 px-[clamp(1rem,4vw,4rem)] py-3.5 backdrop-blur-lg max-[620px]:gap-2 max-[620px]:px-4 max-[620px]:py-2.5">
        <a
          href="#home"
          className="shrink-0 font-display text-[1.45rem] font-bold max-[620px]:text-xl"
        >
          Oda Knits
          <span className="ml-0.5 text-star" aria-hidden="true">
            *
          </span>
        </a>
        <nav
          className="flex min-w-0 gap-8 overflow-x-auto text-sm font-bold max-[620px]:hidden [&_a]:shrink-0 [&_a]:border-b-2 [&_a]:border-transparent [&_a]:py-1.5 [&_a]:hover:border-rose [&_a]:focus-visible:border-rose"
          aria-label="Main navigation"
        >
          <a href="#work">Work</a>
          <a href="#instagram">Instagram</a>
          <a href="#store">Store</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <CartButton />
          <button
            className="hidden h-10 w-13 place-items-center rounded-lg border-0 bg-transparent text-ink max-[620px]:grid"
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <span className="grid gap-1.5" aria-hidden="true">
              <i className="block h-0.5 w-6 rounded-full bg-current" />
              <i className="block h-0.5 w-6 rounded-full bg-current" />
              <i className="block h-0.5 w-6 rounded-full bg-current" />
            </span>
          </button>
        </div>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed top-0 left-0 z-50 h-dvh w-screen backdrop-blur-sm min-[621px]:hidden"
            style={{ backgroundColor: "rgba(48, 41, 54, 0.55)" }}
            role="presentation"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.nav
              className="relative grid h-full w-screen content-start overflow-hidden bg-cream px-5 pt-7 pb-8 text-lg font-extrabold shadow-[-20px_0_50px_rgba(61,48,70,.24)]"
              aria-label="Mobile navigation"
              onClick={(event) => event.stopPropagation()}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="font-display text-2xl">
                  Oda Knits<span className="text-star">*</span>
                </span>
                <button
                  className="grid size-9 place-items-center rounded-full border border-ink bg-ink text-cream"
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                >
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 6l12 12M18 6 6 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="grid gap-2">
                <a
                  className="group flex items-end justify-between border-b border-ink/15 py-4"
                  href="#work"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-display text-[2.45rem] leading-none transition group-hover:text-wine">
                    Work
                  </span>
                  <span className="mb-1 text-xs uppercase tracking-[0.24em] text-rose">
                    01
                  </span>
                </a>
                <a
                  className="group flex items-end justify-between border-b border-ink/15 py-4"
                  href="#store"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-display text-[2.45rem] leading-none transition group-hover:text-wine">
                    Store
                  </span>
                  <span className="mb-1 text-xs uppercase tracking-[0.24em] text-[#e3a85e]">
                    02
                  </span>
                </a>
                <a
                  className="group flex items-end justify-between border-b border-ink/15 py-4"
                  href="#about"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-display text-[2.45rem] leading-none transition group-hover:text-wine">
                    About
                  </span>
                  <span className="mb-1 text-xs uppercase tracking-[0.24em] text-star">
                    03
                  </span>
                </a>
                <a
                  className="group flex items-end justify-between border-b border-ink/15 py-4"
                  href="#instagram"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-display text-[2.45rem] leading-none transition group-hover:text-wine">
                    Instagram
                  </span>
                  <span className="mb-1 text-xs uppercase tracking-[0.24em] text-wine">
                    04
                  </span>
                </a>
                <a
                  className="group flex items-end justify-between border-b border-ink/15 py-4"
                  href="#contact"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-display text-[2.45rem] leading-none transition group-hover:text-wine">
                    Contact
                  </span>
                  <span className="mb-1 text-xs uppercase tracking-[0.24em] text-[#4f9b84]">
                    05
                  </span>
                </a>
              </div>
              <p className="mt-8 max-w-xs text-sm font-bold leading-relaxed text-[#6d6476]">
                Colorful knits, soft fibers, and works in progress from
                @oda.knits_.
              </p>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
