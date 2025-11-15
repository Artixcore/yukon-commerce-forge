import { useState, useEffect, useRef } from "react";
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
}: OptimizedImageProps) => {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

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

  // Generate Supabase transformation URL
  const getOptimizedUrl = (url: string, targetWidth: number) => {
    if (!url) return url;
    
    // Check if it's a Supabase Storage URL
    if (url.includes('supabase.co/storage')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}width=${targetWidth}&quality=85&format=webp`;
    }
    
    return url;
  };

  // Generate srcset for responsive images
  const srcSet = [640, 768, 1024, 1440, 1920]
    .filter(w => w <= width * 2)
    .map(w => `${getOptimizedUrl(src, w)} ${w}w`)
    .join(', ');

  const mainSrc = getOptimizedUrl(src, width);
  const placeholderSrc = getOptimizedUrl(src, 20);

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
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={isInView ? mainSrc : placeholderSrc}
        srcSet={isInView ? srcSet : undefined}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "w-full h-full transition-opacity duration-300",
          objectFit === 'cover' ? 'object-cover' : 'object-contain',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
};
