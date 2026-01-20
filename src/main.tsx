import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';
import { initAnalytics } from "@/lib/loadAnalytics";

// Register service worker
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
    if (import.meta.env.DEV) {
      console.error('Service Worker registration error:', error);
    }
  },
});

// Initialize analytics after idle time
initAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
