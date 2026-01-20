import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { IMAGE_SIZES } from "@/config/imageSizes";

export const CategoryGrid = () => {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name")
        .limit(6);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-8 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4">Categories</h2>
        </div>
        
        {/* Rongbazar-style: 2-column grid on mobile, responsive on larger screens */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {categories?.map((category) => (
            <Link key={category.id} to={`/shop?category=${category.id}`} className="block">
              <Card className="aspect-square rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border relative">
                {/* Image container - fills card with square aspect ratio */}
                <div className="w-full h-full absolute inset-0 overflow-hidden bg-muted">
                  {category.image_url ? (
                    <OptimizedImage
                      {...IMAGE_SIZES.categoryIcon}
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <span className="text-3xl md:text-4xl font-semibold text-primary">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                {/* Category name - centered below image */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 md:p-3">
                  <h3 className="font-semibold text-sm md:text-base text-white text-center line-clamp-2">
                    {category.name}
                  </h3>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
