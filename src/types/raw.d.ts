declare module "*?raw" {
  const source: string;
  export default source;
}

interface ImportMetaEnv {
  readonly VITE_EXE_DOWNLOAD_URL?: string;
  readonly VITE_APK_DOWNLOAD_URL?: string;
  readonly VITE_LINUX_DOWNLOAD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
