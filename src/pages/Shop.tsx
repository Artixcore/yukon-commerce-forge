import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/shop/ProductCard";
import { Search } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", searchQuery, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true);

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <p className="text-sm text-muted-foreground">Home / Shop</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <Card className="p-6 sticky top-20">
              <h2 className="font-bold text-lg mb-4">Filters</h2>
              
              {/* Search */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">Categories</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all"
                      checked={selectedCategory === "all"}
                      onCheckedChange={() => setSelectedCategory("all")}
                    />
                    <label htmlFor="all" className="text-sm cursor-pointer">
                      All Categories
                    </label>
                  </div>
                  {categories?.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={category.id}
                        checked={selectedCategory === category.id}
                        onCheckedChange={() => setSelectedCategory(category.id)}
                      />
                      <label htmlFor={category.id} className="text-sm cursor-pointer">
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium mb-3 block">Price Range</label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="0-2000">Under ৳2000</SelectItem>
                    <SelectItem value="2000-4000">৳2000 - ৳4000</SelectItem>
                    <SelectItem value="4000-8000">৳4000 - ৳8000</SelectItem>
                    <SelectItem value="8000+">Over ৳8000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </aside>

          {/* Products Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Products</h1>
              <p className="text-sm text-muted-foreground">
                {products?.length || 0} products found
              </p>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card rounded-lg h-80 animate-pulse" />
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
