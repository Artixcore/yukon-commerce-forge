export const initMetaPixel = () => {
  const pixelId = localStorage.getItem('meta_pixel_id');
  
  if (pixelId && pixelId !== 'null' && pixelId !== 'undefined') {
    // Ensure fbq is available
    if (typeof window.fbq === 'function') {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
      console.log('Meta Pixel initialized:', pixelId);
    }
  }
};

// Re-initialize when pixel ID changes
export const refreshMetaPixel = (newPixelId: string) => {
  localStorage.setItem('meta_pixel_id', newPixelId);
  
  if (typeof window.fbq === 'function') {
    window.fbq('init', newPixelId);
    console.log('Meta Pixel refreshed:', newPixelId);
  }
};
