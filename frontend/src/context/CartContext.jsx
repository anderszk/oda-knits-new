import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCookie, setCookie } from "../lib/cookies";

const CART_COOKIE = "oda-knit-cart";
const CartContext = createContext(null);

function readCart() {
  try {
    const raw = getCookie(CART_COOKIE);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function lineId(productId, size) {
  return `${productId}::${size}`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setCookie(CART_COOKIE, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, size, quantity) => {
    setItems((current) => {
      const id = lineId(product.id, size);
      const existing = current.find((line) => line.lineId === id);
      if (existing) {
        return current.map((line) => (
          line.lineId === id ? { ...line, quantity: Math.min(20, line.quantity + quantity) } : line
        ));
      }
      return [
        ...current,
        {
          lineId: id,
          id: product.id,
          title: product.title,
          price: product.price,
          size,
          quantity: Math.min(20, quantity),
          colors: product.colors || [],
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    setItems((current) => (
      quantity <= 0
        ? current.filter((line) => line.lineId !== id)
        : current.map((line) => (line.lineId === id ? { ...line, quantity: Math.min(20, quantity) } : line))
    ));
  }, []);

  const removeItem = useCallback((id) => {
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

  const value = useMemo(() => ({
    items, count, subtotal, drawerOpen,
    addItem, updateQuantity, removeItem, clear,
    openDrawer, closeDrawer, toggleDrawer,
  }), [items, count, subtotal, drawerOpen, addItem, updateQuantity, removeItem, clear, openDrawer, closeDrawer, toggleDrawer]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
