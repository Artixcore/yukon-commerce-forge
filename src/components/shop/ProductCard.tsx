import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface ProductCardProps {
  product: any;
}

const ProductCardComponent = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    toast.success("Added to cart");
  }, [addItem, product]);

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
      <Card className="overflow-hidden border transition-shadow hover:shadow-lg h-full flex flex-col" style={{ borderRadius: '15px' }}>
        {/* Image with Discount Badge */}
        <div className="relative overflow-hidden" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
          <OptimizedImage
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            width={400}
            height={256}
            className="w-full h-48 sm:h-64"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {product.discount_percentage > 0 && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs sm:text-sm font-bold">
              -{product.discount_percentage}%
            </div>
          )}
        </div>
        
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 flex flex-col flex-1">
          {/* Rating Section */}
          <div className="min-h-[1.5rem] flex items-center">
            {stars ? (
              <div className="flex items-center gap-1">
                {stars}
                <span className="text-xs text-muted-foreground ml-1">
                  ({product.review_count || 0})
                </span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                No ratings yet
              </div>
            )}
          </div>

          {/* Product Name and Price */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-medium text-sm sm:text-base text-foreground line-clamp-2 flex-1">
              {product.name}
            </h3>
            <div className="flex flex-col items-end min-h-[3rem]">
              <span className="font-bold text-base sm:text-lg text-foreground">
                ৳{product.price}
              </span>
              <span className="text-xs text-muted-foreground line-through h-4">
                {product.original_price && product.original_price > product.price 
                  ? `৳${product.original_price}`
                  : '\u00A0'
                }
              </span>
            </div>
          </div>

        </div>
        
        {/* Add to Cart Button - Full Width */}
        <Button
          onClick={handleAddToCart}
          disabled={product.stock_quantity === 0}
          className="w-full h-9 sm:h-10 text-sm rounded-none mt-auto"
          style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}
          variant="default"
        >
          {product.stock_quantity === 0 ? "Out of Stock" : "Add to cart"}
        </Button>
      </Card>
    </Link>
  );
};

export const ProductCard = memo(ProductCardComponent);
