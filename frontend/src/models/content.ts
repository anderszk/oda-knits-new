export interface AboutDetail {
  label: string;
  value: string;
}

export interface AboutContent {
  name: string;
  headline: string;
  body: string[] | string;
  details: AboutDetail[];
  stats: AboutDetail[];
}

export function aboutDetailTiles(about: Pick<AboutContent, "details" | "stats"> | null | undefined): AboutDetail[] {
  const details = about?.details || [];
  return details.length >= 4 ? details : [...details, ...(about?.stats || []).slice(0, 4 - details.length)];
}

export interface ContactInfo {
  eyebrow: string;
  heading: string;
  body: string;
  button: string;
  success: string;
}
