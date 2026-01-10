import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, Search, Phone, ChevronDown, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.png";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { buildCategoryTree, CategoryTree } from "@/lib/categoryUtils";
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

  // Recursive render for desktop sub-dropdowns with slide-in animation
  const renderDesktopCategory = (category: CategoryTree, level: number = 0): JSX.Element => {
    const hasChildren = category.children.length > 0;
    
    return (
      <li key={category.id} className="relative group/item">
        <NavigationMenuLink asChild>
          <Link
            to={`/shop?category=${category.id}`}
            className="flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-primary rounded-md transition-colors"
          >
            {category.name}
            {hasChildren && <ChevronRight className="h-4 w-4" />}
          </Link>
        </NavigationMenuLink>
        
        {/* Sub-dropdown with slide-in animation */}
        {hasChildren && (
          <ul className="absolute left-full top-0 ml-1 w-48 p-2 bg-background shadow-lg rounded-md border border-border opacity-0 invisible translate-x-2 group-hover/item:opacity-100 group-hover/item:visible group-hover/item:translate-x-0 transition-all duration-200 ease-out z-50">
            {category.children.map((child) => renderDesktopCategory(child, level + 1))}
          </ul>
        )}
      </li>
    );
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
    <header className="sticky top-0 z-50 w-full bg-background border-b">
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-center py-2 text-sm font-medium">
          You're currently offline. Some features may be limited.
        </div>
      )}
      
      {/* Top Mini Bar - Desktop Only */}
      <div className="hidden lg:block border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2 text-sm">
            {/* Left: Order Tracking */}
            <Link to="/track" className="text-muted-foreground hover:text-primary transition-colors">
              Order Tracking
            </Link>
            
            {/* Center: Call Us Now */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Call Us Now</span>
              <a href="tel:+8801906192164" className="text-primary font-medium hover:underline flex items-center gap-1">
                <Phone className="h-3 w-3" />
                +880 1906-192164
              </a>
            </div>
            
            {/* Right: Login/Signup + Cart */}
            <div className="flex items-center gap-4">
              <Link to="/admin/login" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <User className="h-4 w-4" />
                Login
              </Link>
              <Link to="/cart" className="relative">
                <ShoppingCart className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex items-center justify-between gap-2 py-2 md:py-3 lg:py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
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
          <div className="flex flex-1 md:max-w-2xl mx-2 md:mx-4 lg:mx-8">
            {/* Mobile: Small Search Input (shown when menu is closed) */}
            {!mobileMenuOpen && (
              <form onSubmit={handleSearch} className="relative w-full md:hidden">
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
            )}
            
            {/* Desktop: Full Search Bar */}
            <form onSubmit={handleSearch} className="relative w-full hidden md:block">
              <Input
                type="text"
                placeholder="Search product"
                className="w-full pr-12 h-10 lg:h-11 rounded-r-none border-r-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-0 top-0 h-10 lg:h-11 rounded-l-none"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 md:gap-2 lg:gap-3">
            {/* Phone - Desktop Only (mobile shows in bottom nav) */}
            <a href="tel:+8801906192164" className="hidden lg:flex items-center gap-2 text-primary hover:underline">
              <Phone className="h-4 w-4" />
              <span className="text-sm font-medium">+880 1906-192164</span>
            </a>

            {/* Cart Icon */}
            <Link to="/cart" className="block">
              <Button size="icon" variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
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
                    <ul className="w-56 p-2 bg-background shadow-lg rounded-md">
                      {/* All Products Link */}
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/shop"
                            className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-primary rounded-md transition-colors"
                          >
                            All Products
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      
                      {/* Separator */}
                      <li className="my-1 h-px bg-border" />
                      
                      {/* Category Items - Recursive rendering */}
                      {categoryTree.map((category) => renderDesktopCategory(category))}
                    </ul>
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
