import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCookie, setCookie } from "@/lib/cookies";
import { cartLineId, createCartLine, type CartLine } from "@/models/cartLine";
import type { Product } from "@/models/product";

const CART_COOKIE = "oda-knit-cart";

interface CartContextValue {
  items: CartLine[];
  count: number;
  subtotal: number;
  drawerOpen: boolean;
  addItem: (product: Product, size: string, quantity: number) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartLine[] {
  try {
    const raw = getCookie(CART_COOKIE);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(readCart);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setCookie(CART_COOKIE, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product, size: string, quantity: number) => {
    setItems((current) => {
      const id = cartLineId(product.id, size);
      const existing = current.find((line) => line.lineId === id);
      if (existing) {
        return current.map((line) => (
          line.lineId === id ? { ...line, quantity: Math.min(20, line.quantity + quantity) } : line
        ));
      }
      return [...current, createCartLine(product, size, Math.min(20, quantity))];
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) => (
      quantity <= 0
        ? current.filter((line) => line.lineId !== id)
        : current.map((line) => (line.lineId === id ? { ...line, quantity: Math.min(20, quantity) } : line))
    ));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((line) => line.lineId !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((open) => !open), []);

  const { count, subtotal } = useMemo(() => ({
    count: items.reduce((total, line) => total + line.quantity, 0),
    subtotal: items.reduce((total, line) => total + line.quantity * line.price, 0),
  }), [items]);

  const value = useMemo<CartContextValue>(() => ({
    items, count, subtotal, drawerOpen,
    addItem, updateQuantity, removeItem, clear,
    openDrawer, closeDrawer, toggleDrawer,
  }), [items, count, subtotal, drawerOpen, addItem, updateQuantity, removeItem, clear, openDrawer, closeDrawer, toggleDrawer]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
