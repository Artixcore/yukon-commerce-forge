// Centralized image size configuration for consistent optimization across the app

export const IMAGE_SIZES = {
  // Product listings
  productCard: {
    width: 400,
    height: 256,
    sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  },
  
  // Product detail
  productMain: {
    width: 800,
    height: 800,
    sizes: '(max-width: 768px) 100vw, 50vw',
  },
  
  productThumbnail: {
    width: 80,
    height: 80,
    sizes: '80px',
  },
  
  // Cart & Checkout
  cartThumbnail: {
    width: 96,
    height: 96,
    sizes: '96px',
  },
  
  checkoutThumbnail: {
    width: 64,
    height: 64,
    sizes: '64px',
  },
  
  // Gallery
  galleryImage: {
    width: 600,
    height: 400,
    sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
  },
  
  // Hero banners
  heroBanner: {
    width: 1920,
    height: 600,
    sizes: '100vw',
  },
  
  // Admin thumbnails
  adminThumbnail: {
    width: 80,
    height: 80,
    sizes: '80px',
  },
} as const;
