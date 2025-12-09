import { useState, useRef, useCallback } from "react";
import { ZoomIn } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ImageLightbox } from "./ImageLightbox";

interface ImageZoomProps {
  src: string;
  alt: string;
  allImages: string[];
  currentIndex: number;
  priority?: boolean;
}

export const ImageZoom = ({ src, alt, allImages, currentIndex, priority }: ImageZoomProps) => {
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isMobile) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({ x, y });
  }, [isMobile]);

  const handleMouseEnter = () => {
    if (!isMobile) setIsZooming(true);
  };

  const handleMouseLeave = () => {
    if (!isMobile) setIsZooming(false);
  };

  const handleClick = () => {
    setLightboxOpen(true);
  };

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full h-full cursor-zoom-in group"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Main Image */}
        <OptimizedImage
          src={src}
          alt={alt}
          width={800}
          height={800}
          priority={priority}
          className="w-full h-full"
          objectFit="contain"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Zoom Indicator */}
        <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ZoomIn className="h-5 w-5 text-foreground" />
        </div>

        {/* Desktop Zoom Lens Overlay */}
        {isZooming && !isMobile && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "200%",
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
      </div>

      {/* Lightbox for fullscreen view */}
      <ImageLightbox
        images={allImages}
        initialIndex={currentIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  );
};
