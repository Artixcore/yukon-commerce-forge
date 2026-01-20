/**
 * Load analytics scripts after idle time to avoid blocking LCP/TBT
 */

// Polyfill for requestIdleCallback
const requestIdleCallback = window.requestIdleCallback || 
  ((cb: IdleRequestCallback) => {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, 1);
  });

/**
 * Load Meta Pixel script after idle time
 */
export const loadMetaPixel = () => {
  try {
    requestIdleCallback(() => {
      try {
        // Only load if not already loaded
        if (window.fbq) return;
        
        const script = document.createElement('script');
        script.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
        `;
        document.head.appendChild(script);
      } catch (error) {
        // Silent fail - analytics should not break the app
        if (import.meta.env.DEV) {
          console.error('Meta Pixel load error:', error);
        }
      }
    }, { timeout: 2000 });
  } catch (error) {
    // Silent fail - analytics should not break the app
    if (import.meta.env.DEV) {
      console.error('Meta Pixel initialization error:', error);
    }
  }
};

/**
 * Load Google Analytics after idle time
 */
export const loadGoogleAnalytics = () => {
  try {
    requestIdleCallback(() => {
      try {
        const gaMeasurementId = localStorage.getItem('ga_measurement_id');
        if (!gaMeasurementId || gaMeasurementId === 'null' || gaMeasurementId === 'undefined') {
          return;
        }
        
        // Check if already loaded
        if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
          return;
        }
        
        // Load gtag.js script
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaMeasurementId;
        document.head.appendChild(script);
        
        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
          window.dataLayer.push(args);
        }
        (window as any).gtag = gtag;
        gtag('js', new Date());
        gtag('config', gaMeasurementId);
      } catch (error) {
        // Silent fail - analytics should not break the app
        if (import.meta.env.DEV) {
          console.error('Google Analytics load error:', error);
        }
      }
    }, { timeout: 2000 });
  } catch (error) {
    // Silent fail - analytics should not break the app
    if (import.meta.env.DEV) {
      console.error('Google Analytics initialization error:', error);
    }
  }
};

/**
 * Initialize all analytics after page load and idle time
 */
export const initAnalytics = () => {
  try {
    // Wait for page to be interactive, then wait for idle time
    if (document.readyState === 'complete') {
      loadMetaPixel();
      loadGoogleAnalytics();
    } else {
      window.addEventListener('load', () => {
        try {
          loadMetaPixel();
          loadGoogleAnalytics();
        } catch (error) {
          // Silent fail - analytics should not break the app
          if (import.meta.env.DEV) {
            console.error('Analytics load event error:', error);
          }
        }
      });
    }
  } catch (error) {
    // Silent fail - analytics should not break the app
    if (import.meta.env.DEV) {
      console.error('Analytics initialization error:', error);
    }
  }
};
