import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { memo, useMemo } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface ProductCardProps {
  product: any;
}

const ProductCardComponent = ({ product }: ProductCardProps) => {

  const stars = useMemo(() => {
    if (!product.rating) return null;
    const starElements = [];
    const fullStars = Math.floor(product.rating);
    
    for (let i = 0; i < 5; i++) {
      starElements.push(
        <Star
          key={i}
          className={`h-3 w-3 sm:h-4 sm:w-4 ${
            i < fullStars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      );
    }
    return starElements;
  }, [product.rating]);

  return (
    <Link to={`/product/${product.slug}`} className="h-full">
      <Card className="overflow-hidden border transition-shadow hover:shadow-lg h-full flex flex-col rounded-lg">
        {/* Image with Discount Badge */}
        <div className="relative overflow-hidden bg-white aspect-square">
          <OptimizedImage
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            width={400}
            height={400}
            className="w-full h-full object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 15vw, (max-width: 1536px) 13vw, 12vw"
          />
          {product.discount_percentage > 0 && (
            <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded text-xs font-bold">
              {product.discount_percentage}%
            </div>
          )}
        </div>
        
        <div className="p-2 sm:p-3 flex flex-col flex-1">
          {/* Product Name */}
          <h3 className="font-medium text-sm sm:text-base text-foreground line-clamp-2 mb-1.5 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Price Row */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-base sm:text-lg text-foreground">
              ৳{product.price}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                ৳{product.original_price}
              </span>
            )}
          </div>

          {/* Rating Section - Optional, smaller */}
          {stars && (
            <div className="flex items-center gap-1 mb-2">
              {stars}
              <span className="text-xs text-muted-foreground">
                ({product.review_count || 0})
              </span>
            </div>
          )}
        </div>
        
        {/* Order Now Button - Full Width */}
        <Button
          disabled={product.stock_quantity === 0}
          className="w-full h-8 sm:h-9 text-sm rounded-t-none mt-auto bg-black text-white hover:bg-black/90 disabled:bg-muted disabled:text-muted-foreground"
          variant="default"
        >
          {product.stock_quantity === 0 ? "Out of Stock" : "Order Now"}
        </Button>
      </Card>
    </Link>
  );
};

export const ProductCard = memo(ProductCardComponent);
