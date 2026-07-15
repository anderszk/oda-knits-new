import type { ColorSwatch } from "./color";

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  images: string[];
  yarn: string;
  fiber: string;
  technique: string;
  needles: string;
  size: string;
  time: string;
  year: string;
  colors: ColorSwatch[];
  created_at?: string;
  updated_at?: string;
}

export function isWip(year: string): boolean {
  return String(year || "").trim().toLowerCase() === "wip";
}
