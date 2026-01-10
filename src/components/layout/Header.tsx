import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, Search, Phone, ChevronDown, ChevronRight, User, Heart } from "lucide-react";
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
        <div className="hidden md:grid grid-cols-[auto_1fr_auto] items-center gap-3 lg:gap-6 py-3 lg:py-4">
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
          <div className="min-w-0">
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
            {/* Phone Block - Tablet: icon + number only, Desktop: full text */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2 overflow-hidden">
              <span className="hidden lg:inline text-sm text-muted-foreground shrink-0">Call Us Now:</span>
              <a href="tel:+8801906192164" className="text-sm font-medium text-primary hover:underline flex items-center gap-1 shrink-0">
                <Phone className="h-4 w-4 shrink-0" />
                <span className="truncate">01613035048</span>
              </a>
            </div>

            {/* Wishlist Icon - Desktop Only */}
            <Button size="icon" variant="ghost" className="hidden lg:flex relative h-9 md:h-10 w-9 md:w-10 shrink-0">
              <Heart className="h-4 w-4 md:h-5 md:w-5" />
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Button>

            {/* User/Login - Desktop Only */}
            <Link to="/admin/login" className="hidden lg:flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors shrink-0">
              <User className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap">Hi, Login/Signup</span>
            </Link>

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
              
              <Link to="/admin/login">
                <User className="h-5 w-5" />
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
      <nav className="bg-black border-t h-12">
        <div className="container mx-auto px-4 h-full">
          {/* Desktop & Tablet: Horizontal navigation */}
          <div className="hidden md:flex items-center justify-center gap-4 lg:gap-6 h-full overflow-x-auto scrollbar-hide">
            <Link to="/" className="text-white hover:text-primary transition-colors font-medium text-sm whitespace-nowrap shrink-0">
              Home
            </Link>
            
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-white hover:text-primary font-medium bg-transparent hover:bg-transparent data-[state=open]:bg-transparent h-auto py-0 text-sm whitespace-nowrap">
                    MEN'S FASHION
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
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

            <Link to="/shop" className="text-white hover:text-primary transition-colors font-medium text-sm whitespace-nowrap shrink-0">
              WOMENS FASHION
            </Link>
            <Link to="/shop" className="text-white hover:text-primary transition-colors font-medium text-sm whitespace-nowrap shrink-0">
              WINTER COLLECTIONS
            </Link>
            <Link to="/shop" className="text-white hover:text-primary transition-colors font-medium text-sm whitespace-nowrap shrink-0">
              GADGET & ELECTRONICS
            </Link>
            <Link to="/reviews" className="text-white hover:text-primary transition-colors font-medium text-sm whitespace-nowrap shrink-0">
              Reviews
            </Link>
            <Link to="/best-selling" className="text-white hover:text-primary transition-colors font-medium text-sm whitespace-nowrap shrink-0">
              Best Selling
            </Link>
            <Link to="/flash-selling" className="text-white hover:text-primary transition-colors font-medium text-sm whitespace-nowrap shrink-0">
              Flash Selling
            </Link>
          </div>
          
          {/* Mobile: Horizontal scroll navbar */}
          <div className="md:hidden flex items-center gap-4 h-full overflow-x-auto scrollbar-hide px-2">
            <Link to="/" className="text-white hover:text-primary transition-colors font-medium text-xs whitespace-nowrap shrink-0">
              Home
            </Link>
            <Link to="/shop" className="text-white hover:text-primary transition-colors font-medium text-xs whitespace-nowrap shrink-0">
              MEN'S FASHION
            </Link>
            <Link to="/shop" className="text-white hover:text-primary transition-colors font-medium text-xs whitespace-nowrap shrink-0">
              WOMENS FASHION
            </Link>
            <Link to="/shop" className="text-white hover:text-primary transition-colors font-medium text-xs whitespace-nowrap shrink-0">
              WINTER COLLECTIONS
            </Link>
            <Link to="/reviews" className="text-white hover:text-primary transition-colors font-medium text-xs whitespace-nowrap shrink-0">
              Reviews
            </Link>
            <Link to="/best-selling" className="text-white hover:text-primary transition-colors font-medium text-xs whitespace-nowrap shrink-0">
              Best Selling
            </Link>
            <Link to="/flash-selling" className="text-white hover:text-primary transition-colors font-medium text-xs whitespace-nowrap shrink-0">
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
