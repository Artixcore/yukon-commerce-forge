import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';
import { initAnalytics } from "@/lib/loadAnalytics";

// Register service worker with error handling
// Can be disabled via VITE_DISABLE_SW environment variable
if (import.meta.env.VITE_DISABLE_SW !== 'true') {
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
        // Log error but don't break app
        if (import.meta.env.DEV) {
          console.error('Service Worker registration error:', error);
        }
        // Silently fail - app should work without SW
      },
    });
  } catch (error) {
    // Catch any errors during SW registration
    if (import.meta.env.DEV) {
      console.error('Service Worker setup error:', error);
    }
    // Continue without SW - app must work
  }
}

// Initialize analytics after idle time
try {
  initAnalytics();
} catch (error) {
  // Analytics errors should not break the app
  if (import.meta.env.DEV) {
    console.error('Analytics initialization error:', error);
  }
}

// Render app - this must always succeed
createRoot(document.getElementById("root")!).render(<App />);
