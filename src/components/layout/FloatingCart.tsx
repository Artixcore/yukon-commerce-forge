import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export const FloatingCart = () => {
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      to="/cart"
      className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-40 bg-background border border-border shadow-lg rounded-lg p-4 flex-col items-center gap-2 hover:shadow-xl transition-shadow"
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6 text-foreground" />
        {cartItemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {cartItemCount > 9 ? '9+' : cartItemCount}
          </span>
        )}
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{cartItemCount} items</span>
    </Link>
  );
};
