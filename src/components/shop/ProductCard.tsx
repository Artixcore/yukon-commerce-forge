import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { Star } from "lucide-react";

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

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-3 w-3 sm:h-4 sm:w-4 ${
            i < fullStars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <Link to={`/product/${product.slug}`}>
      <Card className="overflow-hidden border transition-shadow hover:shadow-lg">
        {/* Image with Discount Badge */}
        <div className="relative overflow-hidden bg-muted">
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-48 sm:h-64 object-cover"
          />
          {product.discount_percentage > 0 && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs sm:text-sm font-bold">
              -{product.discount_percentage}%
            </div>
          )}
        </div>
        
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {/* Rating Section */}
          {product.rating ? (
            <div className="flex items-center gap-1">
              {renderStars(product.rating)}
              <span className="text-xs text-muted-foreground ml-1">
                ({product.review_count || 0})
              </span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              No ratings yet
            </div>
          )}

          {/* Product Name and Price */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-medium text-sm sm:text-base text-foreground line-clamp-2 flex-1">
              {product.name}
            </h3>
            <div className="flex flex-col items-end">
              <span className="font-bold text-base sm:text-lg text-foreground">
                ৳{product.price}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xs text-muted-foreground line-through">
                  ৳{product.original_price}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0}
            className="w-full h-9 sm:h-10 text-sm rounded-xl"
            variant="default"
          >
            {product.stock_quantity === 0 ? "Out of Stock" : "Add to cart"}
          </Button>
        </div>
      </Card>
    </Link>
  );
};
