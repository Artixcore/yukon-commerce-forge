import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Check if service worker registration should be attempted
// Service workers require HTTPS (or localhost) and valid SSL certificate
const shouldRegisterSW = () => {
  // Only register if:
  // 1. We're on localhost (development)
  // 2. We're on HTTPS with a valid protocol
  // 3. Not on an IP address with invalid SSL (common issue)
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '[::1]';
  const isHttps = window.location.protocol === 'https:';
  const isIpAddress = /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname);
  
  // Register on localhost or HTTPS (but skip IP addresses with potential SSL issues)
  return isLocalhost || (isHttps && !isIpAddress);
};

// Register service worker conditionally
if (shouldRegisterSW() && 'serviceWorker' in navigator) {
  try {
    const updateSW = registerSW({
      onNeedRefresh() {
        updateSW(true);
      },
      onOfflineReady() {
        // Ready to work offline
      },
      onRegistered(registration) {
        if (import.meta.env.DEV) {
          console.log('Service Worker registered:', registration);
        }
      },
      onRegisterError(error) {
        // Silently handle SSL certificate errors and other registration failures
        // This prevents console errors when SSL is invalid or service worker can't be registered
        if (import.meta.env.DEV) {
          console.warn('Service Worker registration error (non-critical):', error);
        }
        // Don't throw - allow app to continue functioning without service worker
      },
    });
  } catch (error) {
    // Catch any errors during registration setup
    if (import.meta.env.DEV) {
      console.warn('Service Worker setup error (non-critical):', error);
    }
  }
} else {
  // Log reason for not registering (only in dev mode)
  if (import.meta.env.DEV) {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported in this browser');
    } else if (!shouldRegisterSW()) {
      console.log('Service Worker registration skipped: requires HTTPS or localhost');
    }
  }
}

createRoot(document.getElementById("root")!).render(<App />);
