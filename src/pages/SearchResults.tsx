import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/shop/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import * as z from "zod";

const searchQuerySchema = z.string()
  .trim()
  .min(1, "Search query is required")
  .max(100, "Search query is too long")
  .regex(/^[\p{L}\p{N}\s\-_.,&]+$/u, "Search contains invalid characters");

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const rawSearchQuery = searchParams.get("q") || "";
  
  // Validate search query
  const searchQuery = (() => {
    try {
      return searchQuerySchema.parse(rawSearchQuery);
    } catch {
      return "";
    }
  })();

  const { data: products, isLoading } = useQuery({
    queryKey: ["search-products", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      
      // Escape special characters for SQL LIKE
      const sanitizedQuery = searchQuery.replace(/[%_]/g, '\\$&');
      
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!searchQuery,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold">Search Results</h1>
          </div>
          {searchQuery && (
            <p className="text-muted-foreground">
              Showing results for "{searchQuery}" 
              {products && <span className="ml-2">({products.length} items found)</span>}
            </p>
          )}
        </div>

        {!searchQuery ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No search query</h2>
            <p className="text-muted-foreground">Please enter a search term to find products</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No results found</h2>
            <p className="text-muted-foreground">
              We couldn't find any products matching "{searchQuery}"
            </p>
            <p className="text-muted-foreground mt-2">Try different keywords or browse our categories</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SearchResults;
