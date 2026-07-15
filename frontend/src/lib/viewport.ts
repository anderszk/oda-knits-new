export const DESKTOP_QUERY = "(min-width: 621px)";

export function isDesktopViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches;
}
