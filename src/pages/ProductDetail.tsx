import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Minus, Plus, Star } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import useEmblaCarousel from "embla-carousel-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewDialog } from "@/components/product/ReviewDialog";
import { format } from "date-fns";

const ProductDetail = () => {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const { addItem } = useCart();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!product,
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", product?.category_id, product?.id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", product.category_id)
        .eq("is_active", true)
        .neq("id", product.id)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!product,
  });

  const allImages = product ? [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.images || [])
  ] : [];

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      toast.success(`Added ${quantity} ${product.name} to cart`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Link to="/shop">
            <Button>Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Link to="/shop">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="bg-muted rounded-lg aspect-square overflow-hidden" ref={emblaRef}>
              <div className="flex h-full">
                {allImages.length > 0 ? (
                  allImages.map((img, index) => (
                    <div key={index} className="flex-[0_0_100%] min-w-0 flex items-center justify-center">
                      <img
                        src={img}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="flex-[0_0_100%] flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
            </div>
            
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden transition-all ${
                      selectedIndex === index ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col space-y-6">
            <div>
              <span className="inline-block px-3 py-1 text-sm bg-primary/10 text-primary font-medium rounded-full mb-4">
                {product.categories?.name}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{product.name}</h1>
            </div>
            
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                ৳{product.price}
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {product.description || "No description available"}
              </p>
            </div>

            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">Stock:</span>
              {product.stock_quantity > 0 ? (
                <span className="text-primary font-bold">{product.stock_quantity} available</span>
              ) : (
                <span className="text-destructive font-bold">Out of stock</span>
              )}
            </div>

            {product.stock_quantity > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-base font-medium">Quantity:</span>
                  <div className="flex items-center border-2 rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-12 w-12"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <span className="px-8 font-bold text-lg">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      disabled={quantity >= product.stock_quantity}
                      className="h-12 w-12"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <Button onClick={handleAddToCart} size="lg" className="w-full text-lg h-14">
                  <ShoppingCart className="mr-2 h-6 w-6" />
                  Add to Cart
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-6">Customer Reviews</h2>
          
          {/* Review Summary */}
          <div className="flex items-center gap-6 mb-8 p-6 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{product.rating?.toFixed(1) || "0.0"}</div>
              <div className="flex items-center gap-1 justify-center mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                {product.review_count || 0} reviews
              </div>
            </div>
          </div>

          {/* Review List */}
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4 mb-6">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{review.customer_name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground mt-2">{review.review_text}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No reviews yet. Be the first to review this product!
            </div>
          )}

          {/* Add Review Button */}
          <Button 
            onClick={() => setShowReviewDialog(true)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Write a Review
          </Button>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <ReviewDialog 
        open={showReviewDialog} 
        onOpenChange={setShowReviewDialog} 
        productId={product.id}
      />
      
      <Footer />
    </div>
  );
};

export default ProductDetail;
