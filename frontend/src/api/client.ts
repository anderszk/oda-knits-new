const API_BASE = import.meta.env.VITE_API_URL || "";

export class ApiClient {
  async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, options);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `Request failed: ${response.status}`);
    }
    return response.json();
  }

  assetUrl(path?: string): string | undefined {
    return path?.startsWith("/api/") ? `${API_BASE}${path}` : path;
  }
}

export const apiClient = new ApiClient();
