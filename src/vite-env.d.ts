/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  fbq: (action: string, ...args: any[]) => void;
  _fbq: any;
  dataLayer?: any[];
  gtag?: (...args: any[]) => void;
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
}
