import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "@/api";
import type { AboutContent, ContactInfo } from "@/models/content";
import type { Product } from "@/models/product";
import type { Project } from "@/models/project";

interface SiteData {
  work: Project[];
  products: Product[];
  about: AboutContent | null;
  contactInfo: ContactInfo | null;
}

interface BootstrapResponse {
  work: Project[];
  products: Product[];
  about: AboutContent;
  contact_info: ContactInfo;
}

const emptySiteData: SiteData = { work: [], products: [], about: null, contactInfo: null };

const SiteDataContext = createContext<SiteData | null>(null);

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [siteData, setSiteData] = useState<SiteData>(emptySiteData);

  useEffect(() => {
    apiClient
      .request<BootstrapResponse>("/api/bootstrap")
      .then((data) =>
        setSiteData({
          work: data.work,
          products: data.products,
          about: data.about,
          contactInfo: data.contact_info,
        }),
      )
      .catch(console.error);
  }, []);

  return <SiteDataContext.Provider value={siteData}>{children}</SiteDataContext.Provider>;
}

export function useSiteData(): SiteData {
  const context = useContext(SiteDataContext);
  if (!context) throw new Error("useSiteData must be used within a SiteDataProvider");
  return context;
}
