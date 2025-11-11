/// <reference types="vite/client" />

interface Window {
  fbq: (action: string, ...args: any[]) => void;
  _fbq: any;
}
