import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/shop/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

export const BestSelling = () => {
  const { elementRef, isVisible } = useIntersectionObserver({ freezeOnceVisible: true });
  
  const { data: products, isLoading } = useQuery({
    queryKey: ["best-selling-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8);
      
      if (error) throw error;
      return data;
    },
    enabled: isVisible,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  return (
    <section ref={elementRef} className="py-12 bg-background">
      <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-6 xl:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">Top Selling Products</h2>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-7 gap-3 md:gap-4 lg:gap-4 xl:gap-5 w-full">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-7 gap-3 md:gap-4 lg:gap-4 xl:gap-5 w-full">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
