const initPixel = () => {
  const pixelId = localStorage.getItem('meta_pixel_id');
  
  if (pixelId && pixelId !== 'null' && pixelId !== 'undefined') {
    if (typeof window.fbq === 'function') {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
      if (import.meta.env.DEV) {
        console.log('Meta Pixel initialized:', pixelId);
      }
    }
  }
};

export const initMetaPixel = () => {
  // Defer initialization until page is fully loaded
  if (document.readyState === 'complete') {
    initPixel();
  } else {
    window.addEventListener('load', initPixel);
  }
};

// Re-initialize when pixel ID changes
export const refreshMetaPixel = (newPixelId: string) => {
  localStorage.setItem('meta_pixel_id', newPixelId);
  
  if (typeof window.fbq === 'function') {
    window.fbq('init', newPixelId);
    if (import.meta.env.DEV) {
      console.log('Meta Pixel refreshed:', newPixelId);
    }
  }
};
