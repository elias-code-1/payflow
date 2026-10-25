declare module "*?raw" {
  const source: string;
  export default source;
}

interface ImportMetaEnv {
  readonly PAYFLOW_RELEASES_URL?: string;
  readonly PAYFLOW_EXE_DOWNLOAD_URL?: string;
  readonly PAYFLOW_EXE_PORTABLE_DOWNLOAD_URL?: string;
  readonly PAYFLOW_APK_DOWNLOAD_URL?: string;
  readonly PAYFLOW_IPA_DOWNLOAD_URL?: string;
  readonly PAYFLOW_LINUX_DOWNLOAD_URL?: string;
  readonly PAYFLOW_APPIMAGE_DOWNLOAD_URL?: string;
  readonly PAYFLOW_DEB_DOWNLOAD_URL?: string;
  readonly PAYFLOW_RPM_DOWNLOAD_URL?: string;
  readonly PAYFLOW_SNAP_DOWNLOAD_URL?: string;
  readonly PAYFLOW_FLATPAK_DOWNLOAD_URL?: string;
  readonly PAYFLOW_PACMAN_DOWNLOAD_URL?: string;
  readonly PAYFLOW_ALPINE_APK_DOWNLOAD_URL?: string;
  readonly PAYFLOW_FREEBSD_DOWNLOAD_URL?: string;
  readonly PAYFLOW_ARCHIVE_DOWNLOAD_URL?: string;
  readonly PAYFLOW_7Z_DOWNLOAD_URL?: string;
  readonly VITE_RELEASES_URL?: string;
  readonly VITE_EXE_DOWNLOAD_URL?: string;
  readonly VITE_EXE_PORTABLE_DOWNLOAD_URL?: string;
  readonly VITE_APK_DOWNLOAD_URL?: string;
  readonly VITE_IPA_DOWNLOAD_URL?: string;
  readonly VITE_LINUX_DOWNLOAD_URL?: string;
  readonly VITE_APPIMAGE_DOWNLOAD_URL?: string;
  readonly VITE_DEB_DOWNLOAD_URL?: string;
  readonly VITE_RPM_DOWNLOAD_URL?: string;
  readonly VITE_SNAP_DOWNLOAD_URL?: string;
  readonly VITE_FLATPAK_DOWNLOAD_URL?: string;
  readonly VITE_PACMAN_DOWNLOAD_URL?: string;
  readonly VITE_ALPINE_APK_DOWNLOAD_URL?: string;
  readonly VITE_FREEBSD_DOWNLOAD_URL?: string;
  readonly VITE_ARCHIVE_DOWNLOAD_URL?: string;
  readonly VITE_7Z_DOWNLOAD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
