import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-background text-foreground py-8 md:py-12 border-t mt-12 font-bricolage">
      <div className="container mx-auto px-4">
        <div className="space-y-6 md:space-y-8">
          {/* Mobile: 3 lines | Desktop: Single line with 3 columns */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 md:gap-16">
            {/* About Section */}
            <div className="text-center md:text-left md:flex-1">
              <h3 className="font-bold text-base md:text-xl mb-2 md:mb-5">About</h3>
              <p className="text-xs md:text-base leading-relaxed opacity-90">
                Yukon Lifestyle - Your trusted destination for quality products and exceptional service.
              </p>
            </div>

            {/* Mobile: Quick Links and Customer Service side by side | Desktop: Continue in same row */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6 md:gap-16 md:flex-1">
              {/* Quick Links */}
              <div>
                <h3 className="font-bold text-base md:text-xl mb-2 md:mb-5">Quick Links</h3>
                <ul className="space-y-1 md:space-y-3">
                  <li>
                    <Link to="/" className="text-xs md:text-base hover:text-primary transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link to="/shop" className="text-xs md:text-base hover:text-primary transition-colors">
                      Shop
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="text-xs md:text-base hover:text-primary transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-xs md:text-base hover:text-primary transition-colors">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Customer Service */}
              <div>
                <h3 className="font-bold text-base md:text-xl mb-2 md:mb-5">Customer Service</h3>
                <ul className="space-y-1 md:space-y-3">
                  <li>
                    <Link to="/contact" className="text-xs md:text-base hover:text-primary transition-colors">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link to="/returns" className="text-xs md:text-base hover:text-primary transition-colors">
                      Returns
                    </Link>
                  </li>
                  <li>
                    <Link to="/shipping" className="text-xs md:text-base hover:text-primary transition-colors">
                      Shipping Info
                    </Link>
                  </li>
                  <li>
                    <Link to="/track" className="text-xs md:text-base hover:text-primary transition-colors">
                      Track Order
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section with social links and copyright */}
        <div className="border-t border-border/20 mt-6 md:mt-8 pt-6 md:pt-8">
          <div className="flex flex-col items-center gap-4">
            {/* Social Links */}
            <div className="flex gap-4">
              <a 
                href="https://www.facebook.com/YUKONLifestyle/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="Visit our Facebook page"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://www.instagram.com/yukonlifestyle06/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="Visit our Instagram page"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://www.youtube.com/@YUKONLifestyle" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="Visit our YouTube channel"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a 
                href="https://www.tiktok.com/@yukonlifestyle?lang=en" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="Visit our TikTok page"
              >
                <svg 
                  className="h-5 w-5" 
                  fill="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
            
            {/* Copyright */}
            <p className="text-xs md:text-base opacity-90 text-center">
              © {new Date().getFullYear()} Yukon Lifestyle. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
