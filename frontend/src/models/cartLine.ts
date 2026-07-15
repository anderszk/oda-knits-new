import type { ColorSwatch } from "./color";
import type { Product } from "./product";

export interface CartLine {
  lineId: string;
  id: string;
  title: string;
  price: number;
  size: string;
  quantity: number;
  colors: ColorSwatch[];
}

export function cartLineId(productId: string, size: string): string {
  return `${productId}::${size}`;
}

export function createCartLine(product: Product, size: string, quantity: number): CartLine {
  return {
    lineId: cartLineId(product.id, size),
    id: product.id,
    title: product.title,
    price: product.price,
    size,
    quantity,
    colors: product.colors || [],
  };
}
