import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid3x3, FolderOpen, Folder } from "lucide-react";
import { buildCategoryTree, CategoryTree } from "@/lib/categoryUtils";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { IMAGE_SIZES } from "@/config/imageSizes";

const Categories = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const categoryTree = categories ? buildCategoryTree(categories) : [];

  const renderCategoryCard = (category: CategoryTree, isSubcategory = false) => (
    <Link key={category.id} to={`/shop?category=${category.id}`}>
      <Card className="p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group h-full">
        <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors overflow-hidden ${
          isSubcategory ? 'bg-muted' : 'bg-primary/10'
        }`}>
          {category.image_url ? (
            <OptimizedImage
              {...IMAGE_SIZES.categoryIcon}
              src={category.image_url}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              {isSubcategory ? (
                <Folder className="h-6 w-6 text-muted-foreground" />
              ) : (
                <FolderOpen className="h-7 w-7 text-primary" />
              )}
            </>
          )}
        </div>
        <h3 className={`font-semibold group-hover:text-primary transition-colors mb-1 ${
          isSubcategory ? 'text-base' : 'text-lg'
        }`}>
          {category.name}
        </h3>
        {!isSubcategory && (
          <Badge variant="secondary" className="text-xs mb-2">
            {category.children.length > 0 
              ? `${category.children.length} ${category.children.length === 1 ? 'subcategory' : 'subcategories'}` 
              : 'Root Category'}
          </Badge>
        )}
        {category.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {category.description}
          </p>
        )}
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Grid3x3 className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">All Categories</h1>
          </div>
          <p className="text-muted-foreground">
            Browse our complete collection of product categories
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {categoryTree.map((rootCategory) => (
              <div key={rootCategory.id} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {renderCategoryCard(rootCategory, false)}
                </div>
                
                {rootCategory.children.length > 0 && (
                  <div className="ml-4 md:ml-8 pl-4 md:pl-6 border-l-2 border-primary/20">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      {rootCategory.name} Subcategories
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {rootCategory.children.map((subCategory) => (
                        <div key={subCategory.id}>
                          {renderCategoryCard(subCategory, true)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Categories;
