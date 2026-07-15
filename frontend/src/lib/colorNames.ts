import nearestColor from "nearest-color";
import { colornames } from "color-name-list/bestof";

// ~5,000 curated color names (github.com/meodai/color-names), used to auto-suggest a friendly name for a picked hex value.
const NAMED_COLORS: Record<string, string> = Object.fromEntries(colornames.map(({ name, hex }) => [name, hex]));

const matchNearestColor = nearestColor.from(NAMED_COLORS);

export function nearestColorName(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "";
  return matchNearestColor(hex).name;
}
