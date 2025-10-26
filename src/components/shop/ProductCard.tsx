import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

interface ProductCardProps {
  product: any;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    toast.success("Added to cart");
  };

  return (
    <Link to={`/product/${product.id}`}>
      <Card className="overflow-hidden border transition-shadow hover:shadow-md">
        <div className="relative overflow-hidden bg-muted">
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-48 sm:h-64 object-cover"
          />
        </div>
        
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          <h3 className="font-medium text-sm sm:text-base text-foreground line-clamp-2">
            {product.name}
          </h3>
          
          <p className="text-sm sm:text-base text-foreground font-medium">
            Price: ৳{product.price}
          </p>

          <Button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0}
            className="w-full h-9 sm:h-10 text-sm"
            variant="default"
          >
            {product.stock_quantity === 0 ? "Out of Stock" : "Add to cart"}
          </Button>
        </div>
      </Card>
    </Link>
  );
};
