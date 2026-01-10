import { Link, useLocation } from "react-router-dom";
import { Home, Grid3x3, ShoppingCart, Phone, User } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export const MobileBottomNav = () => {
  const { items } = useCart();
  const location = useLocation();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/",
      active: location.pathname === "/",
    },
    {
      icon: Grid3x3,
      label: "Category",
      path: "/categories",
      active: location.pathname === "/categories" || location.pathname.startsWith("/shop"),
    },
    {
      icon: ShoppingCart,
      label: "Cart",
      path: "/cart",
      active: location.pathname === "/cart",
      badge: cartItemCount > 0 ? cartItemCount : undefined,
    },
    {
      icon: Phone,
      label: "Call",
      path: "/contact",
      active: location.pathname === "/contact",
      isLink: false,
      href: "tel:+8801906192164",
    },
    {
      icon: User,
      label: "Login",
      path: "/admin/login",
      active: location.pathname === "/admin/login",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;
          
          const content = (
            <div className="flex flex-col items-center justify-center gap-1 relative">
              <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
          );

          if (item.href) {
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex-1 flex items-center justify-center py-2"
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              className="flex-1 flex items-center justify-center py-2"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
