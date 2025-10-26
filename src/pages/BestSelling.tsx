import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/shop/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

const BestSelling = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["best-selling-products-page"],
    queryFn: async () => {
      // First, get product IDs with their order counts
      const { data: orderStats, error: orderError } = await supabase
        .from("order_items")
        .select("product_id, quantity");

      if (orderError) throw orderError;

      // Calculate total quantity sold per product
      const productSales = orderStats?.reduce((acc, item) => {
        if (!acc[item.product_id]) {
          acc[item.product_id] = 0;
        }
        acc[item.product_id] += item.quantity;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get top 12 product IDs by sales
      const topProductIds = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 12)
        .map(([id]) => id);

      if (topProductIds.length === 0) {
        // If no orders yet, fall back to newest products
        const { data, error } = await supabase
          .from("products")
          .select("*, categories(name)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(12);
        
        if (error) throw error;
        return data;
      }

      // Fetch full product details for best sellers
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .in("id", topProductIds)
        .eq("is_active", true);

      if (error) throw error;

      // Sort products by sales order
      return data.sort((a, b) => {
        const salesA = productSales[a.id] || 0;
        const salesB = productSales[b.id] || 0;
        return salesB - salesA;
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Best Selling Products</h1>
          </div>
          <p className="text-muted-foreground">
            Discover our most popular products loved by customers
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BestSelling;
