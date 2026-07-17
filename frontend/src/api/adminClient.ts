import type { AboutContent, ContactInfo } from "@/models/content";
import type { Product } from "@/models/product";
import type { Project } from "@/models/project";

const API_BASE = import.meta.env.VITE_API_URL || "";
const LOGGED_IN_KEY = "oda-admin-logged-in";

export class AdminApiClient {
  isLoggedIn(): boolean {
    return localStorage.getItem(LOGGED_IN_KEY) === "1";
  }

  private setLoggedIn(loggedIn: boolean): void {
    if (loggedIn) localStorage.setItem(LOGGED_IN_KEY, "1");
    else localStorage.removeItem(LOGGED_IN_KEY);
  }

  async logout(): Promise<void> {
    this.setLoggedIn(false);
    await fetch(`${API_BASE}/api/admin/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, { ...options, credentials: "include" });
    if (response.status === 401) {
      this.setLoggedIn(false);
      throw new Error("Please log in again.");
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `Request failed: ${response.status}`);
    }
    return response.status === 204 ? (null as T) : response.json();
  }

  async login(username: string, password: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || "Wrong username or password.");
    }
    this.setLoggedIn(true);
  }

  listProjects(): Promise<Project[]> {
    return this.request("/api/admin/projects");
  }

  saveProject<T>(project: T, id?: string): Promise<{ ok: boolean; id: string }> {
    return this.request(id ? `/api/admin/projects/${id}` : "/api/admin/projects", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
  }

  deleteProject(id: string): Promise<null> {
    return this.request(`/api/admin/projects/${id}`, { method: "DELETE" });
  }

  listProducts(): Promise<Product[]> {
    return this.request("/api/admin/products");
  }

  saveProduct<T>(product: T, id?: string): Promise<{ ok: boolean; id: string }> {
    return this.request(id ? `/api/admin/products/${id}` : "/api/admin/products", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
  }

  deleteProduct(id: string): Promise<null> {
    return this.request(`/api/admin/products/${id}`, { method: "DELETE" });
  }

  getAbout(): Promise<AboutContent> {
    return this.request("/api/admin/about");
  }

  saveAbout(about: AboutContent): Promise<AboutContent> {
    return this.request("/api/admin/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(about),
    });
  }

  getContactInfo(): Promise<ContactInfo> {
    return this.request("/api/admin/contact-info");
  }

  saveContactInfo(contactInfo: ContactInfo): Promise<ContactInfo> {
    return this.request("/api/admin/contact-info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactInfo),
    });
  }

  uploadFile(file: File): Promise<{ url: string }> {
    const body = new FormData();
    body.append("file", file);
    return this.request("/api/admin/uploads", { method: "POST", body });
  }
}

export const adminApiClient = new AdminApiClient();
