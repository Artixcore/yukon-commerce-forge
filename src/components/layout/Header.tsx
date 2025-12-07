import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, Search, Phone, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.png";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { buildCategoryTree, CategoryTree } from "@/lib/categoryUtils";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { IMAGE_SIZES } from "@/config/imageSizes";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const { items } = useCart();
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();

  const { data: categories } = useQuery({
    queryKey: ["header-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  // Build hierarchical category tree
  const categoryTree = categories ? buildCategoryTree(categories) : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
      setSearchQuery("");
    }
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const toggleMobileCategory = (categoryId: string) => {
    setExpandedMobileCategory(prev => prev === categoryId ? null : categoryId);
  };

  // Render mega menu category card
  const renderMegaMenuCategory = (category: CategoryTree) => {
    const hasChildren = category.children.length > 0;

    return (
      <Link
        key={category.id}
        to={`/shop?category=${category.id}`}
        className="group block rounded-lg p-4 hover:bg-accent transition-all duration-200"
      >
        {/* Category Image */}
        <div className="w-full h-24 rounded-md overflow-hidden mb-3 bg-muted">
          {category.image_url ? (
            <OptimizedImage
              src={category.image_url}
              alt={category.name}
              width={IMAGE_SIZES.megaMenuCategory.width}
              height={IMAGE_SIZES.megaMenuCategory.height}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <span className="text-3xl font-bold text-primary/60">
                {category.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Category Name */}
        <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
          {category.name}
        </h4>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {category.description || 'Explore our collection'}
        </p>

        {/* Subcategories */}
        {hasChildren && (
          <ul className="space-y-1 border-t border-border pt-2 mt-2">
            {category.children.slice(0, 4).map((child) => (
              <li key={child.id}>
                <span className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  {child.name}
                </span>
              </li>
            ))}
            {category.children.length > 4 && (
              <li className="text-xs text-primary font-medium">
                +{category.children.length - 4} more
              </li>
            )}
          </ul>
        )}
      </Link>
    );
  };

  // Render mobile category with expandable subcategories
  const renderMobileCategory = (category: CategoryTree) => {
    const hasChildren = category.children.length > 0;
    const isExpanded = expandedMobileCategory === category.id;

    if (hasChildren) {
      return (
        <div key={category.id}>
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-muted">
              {category.image_url ? (
                <OptimizedImage
                  src={category.image_url}
                  alt={category.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-sm font-bold text-primary/60">
                    {category.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <Link
              to={`/shop?category=${category.id}`}
              className="flex-1 text-foreground hover:text-primary transition-colors py-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              {category.name}
            </Link>
            <button
              onClick={() => toggleMobileCategory(category.id)}
              className="p-1 hover:bg-accent rounded"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {isExpanded && (
            <div className="ml-11 space-y-1 mt-1 border-l-2 border-muted pl-3">
              {category.description && (
                <p className="text-xs text-muted-foreground mb-2">{category.description}</p>
              )}
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  to={`/shop?category=${child.id}`}
                  className="block text-foreground/80 hover:text-primary transition-colors py-1 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={category.id} className="flex items-center gap-3">
        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-muted">
          {category.image_url ? (
            <OptimizedImage
              src={category.image_url}
              alt={category.name}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <span className="text-sm font-bold text-primary/60">
                {category.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <Link
          to={`/shop?category=${category.id}`}
          className="block text-foreground hover:text-primary transition-colors py-1"
          onClick={() => setMobileMenuOpen(false)}
        >
          {category.name}
        </Link>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b">
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-center py-2 text-sm font-medium">
          You're currently offline. Some features may be limited.
        </div>
      )}
      {/* Top bar with logo, search, phone, and cart */}
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex items-center justify-between gap-2 py-2 md:py-0 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={logo}
              alt="YUKON Lifestyle" 
              className="h-8 md:h-10 lg:h-12 w-auto"
              width="120"
              height="48"
              loading="eager"
              decoding="async"
            />
          </Link>

          {/* Search Bar - Mobile & Desktop */}
          <div className="flex flex-1 md:max-w-2xl mx-2 md:mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="text"
                placeholder="Search product"
                className="w-full pr-12 h-9 md:h-11 rounded-r-none border-r-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-0 top-0 h-9 md:h-11 rounded-l-none"
              >
                <Search className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </form>
          </div>

          {/* Right Actions - Mobile & Desktop */}
          <div className="flex items-center gap-1 md:gap-2 lg:gap-4">
            <Button variant="destructive" className="hidden lg:flex items-center gap-2 h-11">
              <Phone className="h-4 w-4" />
              <span>+880 1906-192164</span>
            </Button>

            <Link to="/cart" className="block">
              <Button size="icon" variant="destructive" className="relative h-9 w-9 md:h-11 md:w-11">
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-background text-foreground text-[10px] md:text-xs font-bold rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center border-2 border-primary">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-secondary border-t">
        <div className="container mx-auto px-4">
          <div className="hidden md:flex items-center justify-center gap-8 h-12">
            <Link to="/" className="text-secondary-foreground hover:text-primary transition-colors font-medium">
              Home
            </Link>
            
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-secondary-foreground hover:text-primary font-medium bg-transparent hover:bg-transparent data-[state=open]:bg-transparent h-auto py-0">
                    Product
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[800px] p-6 bg-background shadow-xl">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                        <h3 className="text-lg font-semibold">Browse Categories</h3>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/shop"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            View All Products
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </NavigationMenuLink>
                      </div>

                      {/* Category Grid */}
                      <div className="grid grid-cols-4 gap-4">
                        {/* Featured All Products Card */}
                        <NavigationMenuLink asChild>
                          <Link
                            to="/shop"
                            className="group block rounded-lg p-4 bg-primary/5 hover:bg-primary/10 transition-all duration-200 border border-primary/20"
                          >
                            <div className="w-full h-24 rounded-md overflow-hidden mb-3 bg-primary/10 flex items-center justify-center">
                              <ShoppingCart className="h-10 w-10 text-primary" />
                            </div>
                            <h4 className="font-semibold text-sm mb-1 text-primary">All Products</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              Browse our entire collection
                            </p>
                            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                              Shop Now <ArrowRight className="h-3 w-3" />
                            </div>
                          </Link>
                        </NavigationMenuLink>

                        {/* Category Cards */}
                        {categoryTree.slice(0, 7).map(renderMegaMenuCategory)}
                      </div>

                      {/* Footer */}
                      {categoryTree.length > 7 && (
                        <div className="mt-4 pt-4 border-t border-border text-center">
                          <NavigationMenuLink asChild>
                            <Link
                              to="/categories"
                              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                            >
                              View All {categoryTree.length} Categories
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </NavigationMenuLink>
                        </div>
                      )}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Link to="/reviews" className="text-secondary-foreground hover:text-primary transition-colors font-medium">
              Reviews
            </Link>
            <Link to="/best-selling" className="text-secondary-foreground hover:text-primary transition-colors font-medium">
              Best Selling
            </Link>
            <Link to="/flash-selling" className="text-secondary-foreground hover:text-primary transition-colors font-medium">
              Flash Selling
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-3">
              <Link 
                to="/" 
                className="text-foreground hover:text-primary transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              
              <div>
                <button
                  onClick={() => setProductMenuOpen(!productMenuOpen)}
                  className="flex items-center justify-between w-full text-foreground font-medium py-2"
                >
                  <span>Product</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${productMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {productMenuOpen && (
                  <div className="ml-4 space-y-2 mt-2">
                    <Link 
                      to="/shop" 
                      className="block text-foreground hover:text-primary transition-colors py-1 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      All Products
                    </Link>
                    {categoryTree.map(renderMobileCategory)}
                  </div>
                )}
              </div>

              <Link 
                to="/reviews" 
                className="text-foreground hover:text-primary transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Reviews
              </Link>
              <Link 
                to="/best-selling" 
                className="text-foreground hover:text-primary transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Best Selling
              </Link>
              <Link 
                to="/flash-selling" 
                className="text-foreground hover:text-primary transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Flash Selling
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
