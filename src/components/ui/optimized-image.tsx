import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  objectFit?: 'cover' | 'contain';
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = ({
  src,
  alt,
  width = 800,
  height = 800,
  priority = false,
  className,
  objectFit = 'cover',
  sizes = '100vw',
  onLoad,
  onError,
}: OptimizedImageProps) => {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const startTime = useRef(performance.now());

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  // Generate optimized URL with format support
  const getOptimizedUrl = (url: string, targetWidth: number, format: 'webp' | 'avif' = 'webp') => {
    if (!url) return url;
    
    // Check if it's a Supabase Storage URL
    if (url.includes('supabase.co/storage')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}width=${targetWidth}&quality=85&format=${format}`;
    }
    
    return url;
  };

  // Generate srcset for responsive images
  const generateSrcSet = (format: 'webp' | 'avif' = 'webp') => {
    return [640, 768, 1024, 1440, 1920]
      .filter(w => w <= width * 2)
      .map(w => `${getOptimizedUrl(src, w, format)} ${w}w`)
      .join(', ');
  };

  const avifSrcSet = generateSrcSet('avif');
  const webpSrcSet = generateSrcSet('webp');
  const mainSrc = getOptimizedUrl(src, width);
  const placeholderSrc = getOptimizedUrl(src, 20);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    if (onLoad) onLoad();
    
    // Track performance in development for priority images
    if (import.meta.env.DEV && priority) {
      const loadTime = performance.now() - startTime.current;
      console.debug(`Image loaded in ${Math.round(loadTime)}ms:`, src);
    }
  }, [onLoad, priority, src]);

  const handleError = useCallback(() => {
    setHasError(true);
    if (onError) onError();
    if (import.meta.env.DEV) {
      console.error('Failed to load image:', src);
    }
  }, [onError, src]);

  // Error state with fallback placeholder
  if (hasError) {
    return (
      <div className={cn("bg-muted flex items-center justify-center", className)}>
        <div className="text-center text-muted-foreground text-sm p-4">
          <svg
            className="w-8 h-8 mx-auto mb-2 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {/* Blur placeholder */}
      {!isLoaded && isInView && (
        <img
          src={placeholderSrc}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full blur-xl scale-110",
            objectFit === 'cover' ? 'object-cover' : 'object-contain'
          )}
          aria-hidden="true"
        />
      )}
      
      {/* Main image with multiple format sources */}
      <picture>
        {/* AVIF format - best compression (20-50% better than WebP) */}
        {isInView && src.includes('supabase.co/storage') && (
          <source
            type="image/avif"
            srcSet={avifSrcSet}
            sizes={sizes}
          />
        )}
        
        {/* WebP format - excellent compression, wide support */}
        {isInView && (
          <source
            type="image/webp"
            srcSet={webpSrcSet}
            sizes={sizes}
          />
        )}
        
        {/* Fallback image */}
        <img
          ref={imgRef}
          src={isInView ? mainSrc : placeholderSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full transition-opacity duration-300",
            objectFit === 'cover' ? 'object-cover' : 'object-contain',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      </picture>
    </div>
  );
};
