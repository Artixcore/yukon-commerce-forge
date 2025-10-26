import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-8 md:py-12 border-t mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 md:gap-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-base md:text-lg mb-2 md:mb-4">About</h3>
            <p className="text-xs md:text-sm leading-relaxed opacity-90">
              Yukon Lifestyle - Your trusted destination for quality products and exceptional service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-base md:text-lg mb-2 md:mb-4">Quick Links</h3>
            <ul className="space-y-1 md:space-y-2">
              <li>
                <Link to="/" className="text-xs md:text-sm hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-xs md:text-sm hover:text-primary transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-xs md:text-sm hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-xs md:text-sm hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-bold text-base md:text-lg mb-2 md:mb-4">Customer Service</h3>
            <ul className="space-y-1 md:space-y-2">
              <li>
                <Link to="/contact" className="text-xs md:text-sm hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-xs md:text-sm hover:text-primary transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-xs md:text-sm hover:text-primary transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-xs md:text-sm hover:text-primary transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter - Hidden on mobile */}
          <div className="hidden md:block">
            <h3 className="font-bold text-lg mb-4">Newsletter</h3>
            <p className="text-sm mb-4 opacity-90">
              Subscribe to get updates on our latest offers
            </p>
          </div>
        </div>

        {/* Bottom section with social links and copyright */}
        <div className="border-t border-secondary-foreground/20 mt-6 md:mt-8 pt-6 md:pt-8">
          <div className="flex flex-col items-center gap-4">
            {/* Social Links */}
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
            
            {/* Copyright */}
            <p className="text-xs md:text-sm opacity-90 text-center">
              © {new Date().getFullYear()} Yukon Lifestyle. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
