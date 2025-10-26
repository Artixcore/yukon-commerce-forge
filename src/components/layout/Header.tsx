import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X, Search, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Input } from "@/components/ui/input";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b">
      {/* Top bar with logo, search, phone, and cart */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="bg-primary px-6 py-3 rounded">
              <span className="text-primary-foreground font-bold text-xl tracking-wider">YUKON</span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search product"
                className="w-full pr-12 h-11 rounded-r-none border-r-0"
              />
              <Button
                size="icon"
                className="absolute right-0 top-0 h-11 rounded-l-none"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Phone and Cart */}
          <div className="flex items-center gap-4">
            <Button variant="destructive" className="hidden lg:flex items-center gap-2 h-11">
              <Phone className="h-4 w-4" />
              <span>+880 1906-192164</span>
            </Button>

            <Link to="/cart">
              <Button size="icon" variant="destructive" className="relative h-11 w-11">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-background text-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-primary">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
            <Link to="/shop" className="text-secondary-foreground hover:text-primary transition-colors font-medium">
              Product
            </Link>
            <Link to="/about" className="text-secondary-foreground hover:text-primary transition-colors font-medium">
              About Us
            </Link>
            <Link to="/reviews" className="text-secondary-foreground hover:text-primary transition-colors font-medium">
              Reviews
            </Link>
            <Link to="/categories" className="text-secondary-foreground hover:text-primary transition-colors font-medium">
              Categories
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
          <div className="container mx-auto px-4 py-4 space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search product"
                className="w-full pr-12"
              />
              <Button
                size="icon"
                className="absolute right-0 top-0"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex flex-col space-y-3">
              <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                Home
              </Link>
              <Link to="/shop" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                Product
              </Link>
              <Link to="/about" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                About Us
              </Link>
              <Link to="/reviews" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                Reviews
              </Link>
              <Link to="/categories" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                Categories
              </Link>
              <Link to="/best-selling" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                Best Selling
              </Link>
              <Link to="/flash-selling" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                Flash Selling
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
