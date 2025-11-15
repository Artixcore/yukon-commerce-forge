import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { IMAGE_SIZES } from "@/config/imageSizes";

export const ProductGallery = () => {
  const isMobile = useIsMobile();
  const limit = isMobile ? 6 : 12;
  const { elementRef, isVisible } = useIntersectionObserver({ freezeOnceVisible: true });
  
  const { data: galleryImages, isLoading } = useQuery({
    queryKey: ["gallery-images", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("is_active", true)
        .order("display_order")
        .limit(limit);
      
      if (error) throw error;
      return data;
    },
    enabled: isVisible,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  if (isLoading || !isVisible) {
    return (
      <section ref={elementRef} className="py-12 bg-background">
        <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 gap-2 md:gap-6 lg:gap-8">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!galleryImages || galleryImages.length === 0) {
    return null;
  }

  return (
    <section ref={elementRef} className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
          Gallery
        </h2>
        
        <div className="grid grid-cols-3 gap-2 md:gap-6 lg:gap-8">
          {galleryImages.map((image) => (
            <div
              key={image.id}
              className="relative aspect-square overflow-hidden rounded-lg border border-border"
            >
              <OptimizedImage
                src={image.image_url}
                alt={image.title || "Gallery image"}
                {...IMAGE_SIZES.galleryImage}
                className="rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
