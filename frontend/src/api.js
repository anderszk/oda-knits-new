const API_BASE = import.meta.env.VITE_API_URL || "";

export async function api(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

export function assetUrl(path) {
  return path?.startsWith("/api/") ? `${API_BASE}${path}` : path;
}
