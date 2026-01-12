import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.png";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { buildCategoryTree, CategoryTree } from "@/lib/categoryUtils";
import { CategoryDropdown } from "@/components/layout/CategoryDropdown";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [expandedMobileCategories, setExpandedMobileCategories] = useState<Set<string>>(new Set());
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
    setExpandedMobileCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Recursive render for mobile categories with multi-level support
  const renderMobileCategory = (category: CategoryTree, level: number = 0): JSX.Element => {
    const hasChildren = category.children.length > 0;
    const isExpanded = expandedMobileCategories.has(category.id);
    const paddingLeft = level > 0 ? `${level * 12}px` : undefined;

    if (hasChildren) {
      return (
        <div key={category.id} style={{ paddingLeft }}>
          <div className="flex items-center justify-between">
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
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {isExpanded && (
            <div className="ml-3 space-y-1 mt-1 border-l-2 border-muted pl-3">
              {category.children.map((child) => renderMobileCategory(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={category.id}
        to={`/shop?category=${category.id}`}
        className="block text-foreground hover:text-primary transition-colors py-1"
        style={{ paddingLeft }}
        onClick={() => setMobileMenuOpen(false)}
      >
        {category.name}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b">
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-center py-2 text-sm font-medium">
          You're currently offline. Some features may be limited.
        </div>
      )}
      
      {/* Top Utility Bar - Desktop Only */}
      <div className="hidden lg:block border-b bg-muted/30 h-[34px]">
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full text-xs text-muted-foreground">
            {/* Left: Site Label */}
            <Link to="/" className="hover:text-primary transition-colors font-medium">
              Yukonlifestyle.com
            </Link>
            
            {/* Right: Order Tracking */}
            <Link to="/track" className="hover:text-primary transition-colors">
              Order Tracking
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header - Desktop: 3-column grid, Mobile: 2-row layout */}
      <div className="container mx-auto px-2 md:px-4">
        {/* Desktop & Tablet: 3-column grid layout */}
        <div className="hidden md:grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3 lg:py-4">
          {/* Column 1: Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img 
              src={logo}
              alt="YUKON Lifestyle" 
              className="h-10 lg:h-12 w-auto"
              width="120"
              height="48"
              loading="eager"
              decoding="async"
            />
          </Link>

          {/* Column 2: Search Bar Container */}
          <div className="min-w-0 max-w-2xl">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="text"
                placeholder="Search for something..."
                className="w-full pr-12 h-10 md:h-11 lg:h-12 text-sm md:text-base rounded-r-none border-r-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-0 top-0 h-10 md:h-11 lg:h-12 rounded-l-none"
              >
                <Search className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </form>
          </div>

          {/* Column 3: Right Actions Container */}
          <div className="flex items-center gap-2 lg:gap-3 whitespace-nowrap">
            {/* Cart Icon - Desktop Only */}
            <Link to="/cart" className="hidden lg:block relative shrink-0">
              <div className="flex flex-col items-center">
                <ShoppingCart className="h-6 w-6 text-foreground" />
                <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap">{cartItemCount} items</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile: 2-row layout */}
        <div className="md:hidden">
          {/* Row 1: Logo + Icons */}
          <div className="flex items-center justify-between py-2">
            <Link to="/" className="flex items-center shrink-0">
              <img 
                src={logo}
                alt="YUKON Lifestyle" 
                className="h-8 w-auto"
                width="120"
                height="48"
                loading="eager"
                decoding="async"
              />
            </Link>
            
            <div className="flex items-center gap-2">
              <Link to="/cart" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          {/* Row 2: Full-width Search Bar */}
          {!mobileMenuOpen && (
            <div className="pb-2">
              <form onSubmit={handleSearch} className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search"
                  className="w-full pr-10 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9"
                  variant="ghost"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Black Category Navbar */}
      <nav className="bg-black border-t h-12 relative z-50">
        <div className="container mx-auto px-4 h-full">
          {/* Desktop & Tablet: Horizontal navigation */}
          <div className="hidden md:flex items-center justify-center gap-1 lg:gap-2 h-full overflow-visible">
            <Link to="/" className="text-white hover:text-primary transition-colors font-medium text-sm whitespace-nowrap shrink-0 px-3 py-2">
              Home
            </Link>
            
            {/* Dynamic Category Dropdowns */}
            {categoryTree.map((rootCategory) => (
              <CategoryDropdown key={rootCategory.id} category={rootCategory} isMobile={false} />
            ))}

            <Link to="/reviews" className="text-white hover:text-primary transition-colors font-medium text-sm whitespace-nowrap shrink-0 px-3 py-2 hover:bg-white/10 rounded-md">
              Reviews
            </Link>
            <Link to="/best-selling" className="text-white hover:text-primary transition-colors font-medium text-sm whitespace-nowrap shrink-0 px-3 py-2 hover:bg-white/10 rounded-md">
              Best Selling
            </Link>
            <Link to="/flash-selling" className="text-white hover:text-primary transition-colors font-medium text-sm whitespace-nowrap shrink-0 px-3 py-2 hover:bg-white/10 rounded-md">
              Flash Selling
            </Link>
          </div>
          
          {/* Mobile: Horizontal scroll navbar with dynamic categories */}
          <div className="md:hidden flex items-center gap-3 h-full overflow-x-auto scrollbar-hide px-2 overflow-y-visible">
            <Link to="/" className="text-white hover:text-primary transition-colors font-medium text-xs whitespace-nowrap shrink-0">
              Home
            </Link>
            {categoryTree.map((category) => (
              <CategoryDropdown key={category.id} category={category} isMobile={true} />
            ))}
            <Link to="/reviews" className="text-white hover:text-primary transition-colors font-medium text-xs whitespace-nowrap shrink-0">
              Reviews
            </Link>
            <Link to="/best-selling" className="text-white hover:text-primary transition-colors font-medium text-xs whitespace-nowrap shrink-0">
              Best Selling
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
