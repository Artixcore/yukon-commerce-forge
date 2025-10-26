import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export const ProductGallery = () => {
  const { data: galleryImages, isLoading } = useQuery({
    queryKey: ["gallery-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("is_active", true)
        .order("display_order")
        .limit(12);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 gap-2 md:gap-6 lg:gap-8">
            {[...Array(12)].map((_, i) => (
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
    <section className="py-12 bg-background">
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
              <img
                src={image.image_url}
                alt={image.title || "Gallery image"}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
