import { Link } from "react-router-dom";
import {
  BadgeCheck,
  CreditCard,
  Facebook,
  Headset,
  Linkedin,
  Truck,
  Twitter,
  Youtube,
} from "lucide-react";
import logo from "@/assets/logo.png";

export const Footer = () => {
  const serviceHighlights = [
    {
      title: "High-quality Goods",
      subtitle: "Enjoy top quality items for less",
      icon: BadgeCheck,
    },
    {
      title: "24/7 Live chat",
      subtitle: "Get instant assistance whenever you need it",
      icon: Headset,
    },
    {
      title: "Express Shipping",
      subtitle: "Fast & reliable delivery options",
      icon: Truck,
    },
    {
      title: "Secure Payment",
      subtitle: "Multiple safe payment methods",
      icon: CreditCard,
    },
  ];

  const paymentMethods = [
    "Visa",
    "Mastercard",
    "Amex",
    "Discover",
    "Apple Pay",
    "Google Pay",
    "PayPal",
    "Maestro",
    "UnionPay",
  ];

  return (
    <div className="mt-12">
      {/* Service Highlights Strip */}
      <section className="bg-white border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex flex-col items-center text-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-black border border-black/20 flex items-center justify-center shadow-sm">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="bg-black text-white">
        <div className="container mx-auto px-4 py-10">
          {/* Main Footer Content - Multi-column layout */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">
            {/* About Section */}
            <div className="col-span-2 md:col-span-1 lg:col-span-1">
              <Link to="/" className="inline-flex items-center">
                <img
                  src={logo}
                  alt="YUKON Lifestyle"
                  className="h-10 w-auto"
                  width="120"
                  height="48"
                  loading="lazy"
                  decoding="async"
                />
              </Link>
              <p className="text-sm leading-relaxed text-white/70 mt-4">
                YukonLifestyle brings curated everyday essentials with reliable service and value.
              </p>
              <div className="mt-4 text-sm text-white/70 space-y-2">
                <div>
                  <p className="font-semibold text-white mb-1">Address:</p>
                  <p>YUKON Lifestyle Head Office</p>
                  <p>Masterbari, Uttarkhan, Uttara, Dhaka 1230</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">E-mail:</p>
                  <a 
                    href="mailto:yukonlifestyle06@gmail.com" 
                    className="hover:text-primary transition-colors underline"
                  >
                    yukonlifestyle06@gmail.com
                  </a>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Hotline:</p>
                  <a 
                    href="tel:01924492356" 
                    className="hover:text-primary transition-colors underline"
                  >
                    01924492356
                  </a>
                  <span className="text-white/60"> (24 hours, 7 days a week)</span>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">WhatsApp / Imo:</p>
                  <a 
                    href="tel:01924492356" 
                    className="hover:text-primary transition-colors underline"
                  >
                    01924492356
                  </a>
                  <span className="text-white/60"> (24 hours, 7 days a week)</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/track" className="text-sm text-white/70 hover:text-primary transition-colors">
                    Order Tracking
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-sm text-white/70 hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-white/70 hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/admin/login" className="text-sm text-white/70 hover:text-primary transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/admin/login" className="text-sm text-white/70 hover:text-primary transition-colors">
                    Register
                  </Link>
                </li>
              </ul>
            </div>

            {/* Information */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Information</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/shipping" className="text-sm text-white/70 hover:text-primary transition-colors">
                    Delivery Policy
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-sm text-white/70 hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/returns" className="text-sm text-white/70 hover:text-primary transition-colors">
                    Return Policy
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-sm text-white/70 hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Follow Us */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-bold text-lg mb-4 text-white">Follow Us</h3>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.facebook.com/YUKONLifestyle/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-md border border-white/20 flex items-center justify-center text-white/70 hover:text-primary hover:border-primary transition-colors"
                  aria-label="Visit our Facebook page"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://www.youtube.com/@YUKONLifestyle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-md border border-white/20 flex items-center justify-center text-white/70 hover:text-primary hover:border-primary transition-colors"
                  aria-label="Visit our YouTube channel"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="https://x.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-md border border-white/20 flex items-center justify-center text-white/70 hover:text-primary hover:border-primary transition-colors"
                  aria-label="Visit our X (Twitter) page"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-md border border-white/20 flex items-center justify-center text-white/70 hover:text-primary hover:border-primary transition-colors"
                  aria-label="Visit our LinkedIn page"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Payment Icons Row */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {paymentMethods.map((method) => (
                <div
                  key={method}
                  className="min-w-[88px] h-10 rounded-md border border-white/20 text-xs text-white/70 flex items-center justify-center bg-white/5"
                >
                  {method}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-white/70">
              <span>yukonlifestyle.com © all right reserved</span>
              <span>
                Developed by{" "}
                <a
                  href="https://artixcore.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-primary transition-colors"
                >
                  Artixcore
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
