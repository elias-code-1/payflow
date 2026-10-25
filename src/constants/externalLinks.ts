export const DONATION_URL = "https://by-josue.mychariow.com/prd_fmngq8xp/checkout";
export const REPOSITORY_URL = "https://github.com/elias-code-1/payflow";

function sanitizeUrl(value?: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

export interface DownloadLinks {
  exeUrl: string;
  apkUrl: string;
  linuxUrl: string;
}

export const DEFAULT_DOWNLOAD_LINKS: DownloadLinks = {
  exeUrl: sanitizeUrl(import.meta.env.VITE_EXE_DOWNLOAD_URL),
  apkUrl: sanitizeUrl(import.meta.env.VITE_APK_DOWNLOAD_URL),
  linuxUrl: sanitizeUrl(import.meta.env.VITE_LINUX_DOWNLOAD_URL),
};
