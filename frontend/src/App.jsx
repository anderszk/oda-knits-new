import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import About from "./components/About";
import AdminDashboard from "./components/AdminDashboard";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import Contact from "./components/Contact";
import Hero from "./components/Hero";
import InstagramCarousel from "./components/InstagramCarousel";
import Nav from "./components/Nav";
import ProductModal from "./components/ProductModal";
import ProjectModal from "./components/ProjectModal";
import Store from "./components/Store";
import WorkGallery from "./components/WorkGallery";
import { api } from "./api";
import { CartProvider, useCart } from "./context/CartContext";

export default function App() {
  return window.location.pathname.startsWith("/admin") ? (
    <AdminDashboard />
  ) : (
    <CartProvider>
      <PublicSite />
    </CartProvider>
  );
}

function PublicSite() {
  const [work, setWork] = useState([]);
  const [products, setProducts] = useState([]);
  const [about, setAbout] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { closeDrawer } = useCart();

  useEffect(() => {
    Promise.all([api("/api/work"), api("/api/products"), api("/api/about"), api("/api/contact-info")])
      .then(([projects, catalog, info, contact]) => {
        setWork(projects);
        setProducts(catalog);
        setAbout(info);
        setContactInfo(contact);
      })
      .catch(console.error);
  }, []);

  const closeProject = useCallback(() => setSelected(null), []);
  const closeProduct = useCallback(() => setSelectedProduct(null), []);
  const openCheckoutFromProduct = useCallback(() => {
    setSelectedProduct(null);
    closeDrawer();
    setCheckoutOpen(true);
  }, [closeDrawer]);
  const openCheckout = useCallback(() => setCheckoutOpen(true), []);
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <WorkGallery projects={work} onSelect={setSelected} />
        <Store products={products} onSelect={setSelectedProduct} />
        <About about={about} />
        <InstagramCarousel />
        <Contact info={contactInfo} />
      </main>
      <footer className="border-t border-ink/10 bg-cream py-6 pr-[max(5.5rem,4vw)] pl-[clamp(1rem,4vw,4rem)] text-sm font-bold text-[#6f6674] max-[620px]:pl-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="m-0">
          &copy; {new Date().getFullYear()} Kristensen Solutions
        </p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
            <a className="hover:text-wine" href="#work">Work</a>
            <a className="hover:text-wine" href="#store">Store</a>
            <a className="hover:text-wine" href="#about">About</a>
            <a className="hover:text-wine" href="#instagram">Instagram</a>
            <a className="hover:text-wine" href="#contact">Contact</a>
            <a className="hover:text-wine" href="/admin">Admin</a>
          </nav>
        </div>
      </footer>
      <a className="fixed right-4 bottom-4 z-30 grid size-11 place-items-center rounded-full border border-ink bg-ink text-cream shadow-[0_12px_28px_rgba(61,48,70,.22)] transition hover:-translate-y-1 hover:bg-rose hover:text-ink focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" href="#home" aria-label="Scroll to top">
        <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <AnimatePresence>
        {selected && <ProjectModal project={selected} onClose={closeProject} />}
      </AnimatePresence>
      <AnimatePresence>
        {selectedProduct && <ProductModal product={selectedProduct} onClose={closeProduct} onBuyNow={openCheckoutFromProduct} />}
      </AnimatePresence>
      <CartDrawer onCheckout={openCheckout} />
      <AnimatePresence>
        {checkoutOpen && <CheckoutModal onClose={closeCheckout} />}
      </AnimatePresence>
    </>
  );
}
