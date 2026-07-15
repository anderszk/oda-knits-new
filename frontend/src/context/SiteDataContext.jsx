import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

const SiteDataContext = createContext(null);

const emptySiteData = { work: [], products: [], about: null, contactInfo: null };

export function SiteDataProvider({ children }) {
  const [siteData, setSiteData] = useState(emptySiteData);

  useEffect(() => {
    api("/api/bootstrap")
      .then((data) => setSiteData({
        work: data.work,
        products: data.products,
        about: data.about,
        contactInfo: data.contact_info,
      }))
      .catch(console.error);
  }, []);

  return <SiteDataContext.Provider value={siteData}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  const context = useContext(SiteDataContext);
  if (!context) throw new Error("useSiteData must be used within a SiteDataProvider");
  return context;
}
