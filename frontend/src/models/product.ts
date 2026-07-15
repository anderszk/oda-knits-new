import type { ColorSwatch } from "./color";

export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  colors: ColorSwatch[];
  sizes: string[];
  badge: string;
  stock: number;
  image: string;
  images: string[];
}

export const LOW_STOCK_THRESHOLD = 3;

export function isLowStock(stock: number): boolean {
  return typeof stock === "number" && stock <= LOW_STOCK_THRESHOLD;
}
