import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import About from "./components/about/About";
import AdminDashboard from "./components/admin/AdminDashboard";
import CartDrawer from "./components/store/CartDrawer";
import CheckoutModal from "./components/store/CheckoutModal";
import CheckoutPage from "./components/store/CheckoutPage";
import Contact from "./components/contact/Contact";
import Hero from "./components/home/Hero";
import InstagramCarousel from "./components/home/InstagramCarousel";
import Nav from "./components/layout/Nav";
import ProductModal from "./components/store/ProductModal";
import ProjectModal from "./components/work/ProjectModal";
import Store from "./components/store/Store";
import WorkGallery from "./components/work/WorkGallery";
import { CartProvider, useCart } from "./context/CartContext";
import { SiteDataProvider, useSiteData } from "./context/SiteDataContext";
import { isDesktopViewport } from "./lib/viewport";

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((path) => {
    window.history.pushState({}, "", path);
    setPathname(path);
  }, []);

  if (pathname.startsWith("/admin")) return <AdminDashboard />;

  return (
    <CartProvider>
      <SiteDataProvider>
        {pathname.startsWith("/checkout") ? (
          <CheckoutPage onNavigateHome={() => navigate("/")} />
        ) : (
          <PublicSite navigate={navigate} />
        )}
      </SiteDataProvider>
    </CartProvider>
  );
}

function PublicSite({ navigate }) {
  const { work, products, about, contactInfo } = useSiteData();
  const [selected, setSelected] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { closeDrawer } = useCart();

  const closeProject = useCallback(() => setSelected(null), []);
  const closeProduct = useCallback(() => setSelectedProduct(null), []);
  const goToCheckout = useCallback(() => {
    if (isDesktopViewport()) {
      navigate("/checkout");
    } else {
      setCheckoutOpen(true);
    }
  }, [navigate]);
  const openCheckoutFromProduct = useCallback(() => {
    setSelectedProduct(null);
    closeDrawer();
    goToCheckout();
  }, [closeDrawer, goToCheckout]);
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <WorkGallery projects={work} onSelect={setSelected} />
        <InstagramCarousel />
        <Store products={products} onSelect={setSelectedProduct} />
        <About about={about} />
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
      <CartDrawer onCheckout={goToCheckout} />
      <AnimatePresence>
        {checkoutOpen && <CheckoutModal onClose={closeCheckout} />}
      </AnimatePresence>
    </>
  );
}
