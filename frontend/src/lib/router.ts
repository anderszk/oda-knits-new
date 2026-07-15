import { useCallback, useEffect, useState } from "react";

export interface NavigateOptions {
  modal?: boolean;
}

export interface ModalRoute {
  kind: "work" | "store";
  id: string;
}

export function workPath(id: string): string {
  return `/work/${encodeURIComponent(id)}`;
}

export function storePath(id: string): string {
  return `/store/${encodeURIComponent(id)}`;
}

export function parseModalRoute(pathname: string): ModalRoute | null {
  const workMatch = pathname.match(/^\/work\/([^/]+)\/?$/);
  if (workMatch) return { kind: "work", id: decodeURIComponent(workMatch[1]) };
  const storeMatch = pathname.match(/^\/store\/([^/]+)\/?$/);
  if (storeMatch) return { kind: "store", id: decodeURIComponent(storeMatch[1]) };
  return null;
}

export function isModalHistoryEntry(): boolean {
  return !!(window.history.state as { modal?: boolean } | null)?.modal;
}

export function useRouter() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((path: string, options?: NavigateOptions) => {
    window.history.pushState({ modal: !!options?.modal }, "", path);
    setPathname(path);
  }, []);

  return { pathname, navigate };
}
