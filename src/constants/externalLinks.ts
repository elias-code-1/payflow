export const DONATION_URL = "https://by-josue.mychariow.com/prd_fmngq8xp/checkout";
export const REPOSITORY_URL = "https://github.com/elias-code-1/payflow";
export const REPOSITORY_RELEASES_URL = `${REPOSITORY_URL}/releases`;
export const REPOSITORY_ACTIONS_URL = `${REPOSITORY_URL}/actions`;

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
  releasesUrl: string;
  exeUrl: string;
  exePortableUrl: string;
  apkUrl: string;
  ipaUrl: string;
  linuxUrl: string;
  appImageUrl: string;
  debUrl: string;
  rpmUrl: string;
  snapUrl: string;
  flatpakUrl: string;
  pacmanUrl: string;
  alpineApkUrl: string;
  freebsdUrl: string;
  archiveUrl: string;
  sevenZUrl: string;
}

export const DEFAULT_DOWNLOAD_LINKS: DownloadLinks = {
  releasesUrl: sanitizeUrl(import.meta.env.PAYFLOW_RELEASES_URL || import.meta.env.VITE_RELEASES_URL),
  exeUrl: sanitizeUrl(import.meta.env.PAYFLOW_EXE_DOWNLOAD_URL || import.meta.env.VITE_EXE_DOWNLOAD_URL),
  exePortableUrl: sanitizeUrl(
    import.meta.env.PAYFLOW_EXE_PORTABLE_DOWNLOAD_URL || import.meta.env.VITE_EXE_PORTABLE_DOWNLOAD_URL,
  ),
  apkUrl: sanitizeUrl(import.meta.env.PAYFLOW_APK_DOWNLOAD_URL || import.meta.env.VITE_APK_DOWNLOAD_URL),
  ipaUrl: sanitizeUrl(import.meta.env.PAYFLOW_IPA_DOWNLOAD_URL || import.meta.env.VITE_IPA_DOWNLOAD_URL),
  linuxUrl: sanitizeUrl(import.meta.env.PAYFLOW_LINUX_DOWNLOAD_URL || import.meta.env.VITE_LINUX_DOWNLOAD_URL),
  appImageUrl: sanitizeUrl(
    import.meta.env.PAYFLOW_APPIMAGE_DOWNLOAD_URL ||
      import.meta.env.VITE_APPIMAGE_DOWNLOAD_URL ||
      import.meta.env.PAYFLOW_LINUX_DOWNLOAD_URL ||
      import.meta.env.VITE_LINUX_DOWNLOAD_URL,
  ),
  debUrl: sanitizeUrl(import.meta.env.PAYFLOW_DEB_DOWNLOAD_URL || import.meta.env.VITE_DEB_DOWNLOAD_URL),
  rpmUrl: sanitizeUrl(import.meta.env.PAYFLOW_RPM_DOWNLOAD_URL || import.meta.env.VITE_RPM_DOWNLOAD_URL),
  snapUrl: sanitizeUrl(import.meta.env.PAYFLOW_SNAP_DOWNLOAD_URL || import.meta.env.VITE_SNAP_DOWNLOAD_URL),
  flatpakUrl: sanitizeUrl(import.meta.env.PAYFLOW_FLATPAK_DOWNLOAD_URL || import.meta.env.VITE_FLATPAK_DOWNLOAD_URL),
  pacmanUrl: sanitizeUrl(import.meta.env.PAYFLOW_PACMAN_DOWNLOAD_URL || import.meta.env.VITE_PACMAN_DOWNLOAD_URL),
  alpineApkUrl: sanitizeUrl(
    import.meta.env.PAYFLOW_ALPINE_APK_DOWNLOAD_URL || import.meta.env.VITE_ALPINE_APK_DOWNLOAD_URL,
  ),
  freebsdUrl: sanitizeUrl(import.meta.env.PAYFLOW_FREEBSD_DOWNLOAD_URL || import.meta.env.VITE_FREEBSD_DOWNLOAD_URL),
  archiveUrl: sanitizeUrl(import.meta.env.PAYFLOW_ARCHIVE_DOWNLOAD_URL || import.meta.env.VITE_ARCHIVE_DOWNLOAD_URL),
  sevenZUrl: sanitizeUrl(
    import.meta.env.PAYFLOW_7Z_DOWNLOAD_URL ||
      import.meta.env.VITE_7Z_DOWNLOAD_URL ||
      import.meta.env.PAYFLOW_ARCHIVE_DOWNLOAD_URL ||
      import.meta.env.VITE_ARCHIVE_DOWNLOAD_URL,
  ),
};

export async function fetchDownloadLinks(): Promise<DownloadLinks> {
  try {
    const response = await fetch("/api/downloads", { cache: "no-store" });
    if (!response.ok) return DEFAULT_DOWNLOAD_LINKS;
    const data = (await response.json()) as Partial<DownloadLinks>;
    const merged: DownloadLinks = { ...DEFAULT_DOWNLOAD_LINKS };
    (Object.keys(DEFAULT_DOWNLOAD_LINKS) as Array<keyof DownloadLinks>).forEach((key) => {
      const candidate = sanitizeUrl(data[key]);
      if (candidate) merged[key] = candidate;
    });
    if (!merged.appImageUrl && merged.linuxUrl) {
      merged.appImageUrl = merged.linuxUrl;
    }
    return merged;
  } catch {
    return DEFAULT_DOWNLOAD_LINKS;
  }
}
