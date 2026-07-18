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
  image: string;
  images: string[];
}
