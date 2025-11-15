import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

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

createRoot(document.getElementById("root")!).render(<App />);
