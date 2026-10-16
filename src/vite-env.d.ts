/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public canonical origin, e.g. https://www.toolzen.example */
  readonly VITE_SITE_URL?: string
  /** "true" enables ad slot containers. Defaults to disabled. */
  readonly VITE_ADS_ENABLED?: string
  /** Google AdSense publisher id, only used once an account is approved. */
  readonly VITE_ADSENSE_CLIENT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
