import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Minus, Plus, Star, Check, ThumbsUp, HandCoins, Truck, Phone, Heart, ShoppingCart } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import useEmblaCarousel from "embla-carousel-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewDialog } from "@/components/product/ReviewDialog";
import { format } from "date-fns";
import { trackMetaEvent } from "@/lib/metaTracking";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ImageZoom } from "@/components/product/ImageZoom";
import { SEO } from "@/components/SEO";

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
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

  // Auto-select first available color and size
  useEffect(() => {
    if (product?.colors && Array.isArray(product.colors) && product.colors.length > 0 && !selectedColor) {
      setSelectedColor((product.colors as any)[0].name);
    }
    if (product?.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && !selectedSize) {
      setSelectedSize((product.sizes as any)[0]);
    }
  }, [product, selectedColor, selectedSize]);

  // Preload first product image for LCP optimization
  useEffect(() => {
    if (product && allImages.length > 0) {
      const firstImageUrl = allImages[0];
      // Generate optimized URL for preload
      const preloadUrl = firstImageUrl.includes('supabase.co/storage')
        ? `${firstImageUrl}${firstImageUrl.includes('?') ? '&' : '?'}width=800&quality=85&format=webp`
        : firstImageUrl;
      
      // Check if preload link already exists
      let preloadLink = document.querySelector('link[rel="preload"][as="image"][data-product-preload]');
      if (!preloadLink) {
        preloadLink = document.createElement('link');
        preloadLink.setAttribute('rel', 'preload');
        preloadLink.setAttribute('as', 'image');
        preloadLink.setAttribute('fetchpriority', 'high');
        preloadLink.setAttribute('data-product-preload', 'true');
        document.head.appendChild(preloadLink);
      }
      preloadLink.setAttribute('href', preloadUrl);
    }
  }, [product, allImages]);

  // Track ViewContent event when product loads
  useEffect(() => {
    if (product) {
      trackMetaEvent('ViewContent', {
        content_ids: [product.id],
        content_name: product.name,
        value: Number(product.price),
        currency: 'BDT',
        content_type: 'product',
        content_category: product.categories?.name || '',
        num_items: 1,
      });
    }
  }, [product]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity, {
        color: selectedColor,
        size: selectedSize,
      });
      toast.success(`Added ${quantity} ${product.name} to cart`);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addItem(product, quantity, {
        color: selectedColor,
        size: selectedSize,
      });
      navigate('/checkout');
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

  // Generate structured data for product
  const structuredData = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Buy ${product.name} from Yukon Lifestyle`,
    image: allImages.length > 0 ? allImages : [product.image_url],
    brand: {
      '@type': 'Brand',
      name: 'Yukon Lifestyle',
    },
    offers: {
      '@type': 'Offer',
      url: `https://yukonlifestyle.com/product/${product.slug}`,
      priceCurrency: 'BDT',
      price: product.price,
      availability: product.stock_quantity > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Yukon Lifestyle',
      },
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.review_count || 0,
    } : undefined,
  } : undefined;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={product?.name}
        description={product?.description || `Buy ${product?.name} from Yukon Lifestyle. ${product?.categories?.name || 'Premium quality products'}.`}
        image={allImages.length > 0 ? allImages[0] : product?.image_url}
        type="product"
        canonical={`https://yukonlifestyle.com/product/${product?.slug}`}
        structuredData={structuredData}
      />
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Link to="/shop">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
          </Button>
        </Link>

        {/* 3-Column Layout: Image | Product Info | Delivery Box */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
          {/* Image Gallery */}
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <div className="bg-white rounded-lg aspect-square overflow-hidden" ref={emblaRef}>
              <div className="flex h-full">
                {allImages.length > 0 ? (
                  allImages.map((img, index) => (
                    <div key={index} className="flex-[0_0_100%] min-w-0 h-full">
                      <ImageZoom
                        src={img}
                        alt={`${product.name} - ${index + 1}`}
                        allImages={allImages}
                        currentIndex={index}
                        priority={index === 0}
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
                    <OptimizedImage
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Middle Column: Product Info Block */}
          <div className="flex flex-col space-y-4">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList className="text-xs text-muted-foreground">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {product.categories?.name ? (
                    <BreadcrumbLink asChild>
                      <Link to={`/shop?category=${product.category_id}`}>{product.categories.name}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <span className="text-muted-foreground">Category</span>
                  )}
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-foreground">{product.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Product Title */}
            <h1 className="text-2xl lg:text-3xl font-bold">{product.name}</h1>

            {/* Ask for details link */}
            <Link to="/contact" className="text-green-600 hover:text-green-700 text-sm w-fit">
              Ask for details
            </Link>

            {/* Code line */}
            <div className="text-sm text-muted-foreground">
              Code: {product.id.slice(0, 8).toUpperCase()}
            </div>

            {/* Price Row */}
            <div className="flex items-center gap-3">
              <span className="text-2xl lg:text-3xl font-bold">৳{product.price}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-lg text-red-600 line-through">৳{product.original_price}</span>
              )}
            </div>

            {/* bKash Payment Number */}
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm font-semibold text-green-800">bKash Number:</span>
              <a 
                href="tel:01906192164" 
                className="text-sm font-bold text-green-700 hover:text-green-900 underline"
              >
                01906192164
              </a>
            </div>

            {/* Size Selector */}
            {product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Size:</div>
                <div className="flex flex-wrap gap-2">
                  {(product.sizes as string[]).map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-sm border rounded transition-all ${
                        selectedSize === size
                          ? 'bg-black text-white border-black'
                          : 'bg-background text-foreground border-border hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && Array.isArray(product.colors) && product.colors.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Color:</div>
                <div className="flex gap-2">
                  {(product.colors as any[]).map((color: any) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color.name
                          ? 'border-foreground ring-2 ring-offset-2 ring-foreground'
                          : 'border-border'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stock Info */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Stock:</span>
              {product.stock_quantity > 0 ? (
                <span className="text-red-600 font-bold">{product.stock_quantity} available</span>
              ) : (
                <span className="text-destructive font-bold">Out of stock</span>
              )}
            </div>

            {/* Qty + Add to Cart inline */}
            {product.stock_quantity > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 border rounded">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-10 w-10"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      disabled={quantity >= product.stock_quantity}
                      className="h-10 w-10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleAddToCart} 
                    size="lg" 
                    className="flex-1 h-10 bg-muted text-foreground hover:bg-muted/80"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    title="Add to Wishlist"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>

                {/* Big Order Now Button */}
                <Button 
                  onClick={handleBuyNow} 
                  size="lg" 
                  className="w-full h-12 bg-black text-white hover:bg-black/90 text-base font-semibold"
                >
                  Order Now
                </Button>
              </div>
            )}
          </div>

          {/* Right Column: Delivery + Contact Box */}
          <div className="space-y-4">
            {/* Delivery Features Card */}
            <div className="border rounded-lg p-4 space-y-3 bg-white">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm">Home delivery all over the country.</span>
              </div>
              <div className="flex items-center gap-3">
                <ThumbsUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm">Quality Product</span>
              </div>
              <div className="flex items-center gap-3">
                <HandCoins className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <span className="text-sm">Cash On Delivery Available</span>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <span className="text-sm">Delivery Charge Inside Dhaka 60 TK</span>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <span className="text-sm">Delivery Charge Outside Dhaka 120 TK</span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="font-semibold mb-3 text-sm">Have question about this product? please call</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <span className="text-sm"></span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Phone className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <span className="text-sm"></span>
                  <Button variant="outline" size="sm" className="ml-2 h-7 text-xs border-red-500 text-red-500 hover:bg-red-50">
                    Bkash Personal
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Phone className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <span className="text-sm"></span>
                  <Button variant="outline" size="sm" className="ml-2 h-7 text-xs border-red-500 text-red-500 hover:bg-red-50">
                    Nagad Personal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="description" className="mb-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 h-12 p-1">
            <TabsTrigger 
              value="description" 
              className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              DESCRIPTION
            </TabsTrigger>
            <TabsTrigger 
              value="how-to-order"
              className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              HOW TO ORDER
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              REVIEWS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-4">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {product.description || "No description available"}
              </p>

              {/* Size Chart */}
              {product.size_chart && Array.isArray(product.size_chart) && product.size_chart.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">MEASUREMENT [Asian]</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-green-600">👕</span>
                    <span className="text-sm">Size Available: {product.sizes && Array.isArray(product.sizes) ? (product.sizes as string[]).join(", ") : "N/A"}</span>
                  </div>
                  <div className="border-2 rounded-lg overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-bold">Size</TableHead>
                          <TableHead className="font-bold">Length (in)</TableHead>
                          <TableHead className="font-bold">Chest (in)</TableHead>
                          <TableHead className="font-bold">Sleeve (in)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(product.size_chart as any[]).map((row: any) => (
                          <TableRow key={row.size}>
                            <TableCell className="font-semibold">{row.size}</TableCell>
                            <TableCell>{row.length}</TableCell>
                            <TableCell>{row.chest}</TableCell>
                            <TableCell>{row.sleeve}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="how-to-order" className="mt-4">
            <div className="space-y-4">
              <div className="prose max-w-none">
                <h3 className="font-semibold mb-3">How to Order</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Select your preferred size and color from the options above</li>
                  <li>Click on "Add to Cart" or "Order Now" button</li>
                  <li>Review your order in the cart</li>
                  <li>Proceed to checkout and fill in your delivery details</li>
                  <li>Choose your payment method (Cash on Delivery available)</li>
                  <li>Confirm your order</li>
                  <li>You will receive a confirmation message with your order details</li>
                </ol>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Delivery Information:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Inside Dhaka: 60 TK delivery charge</li>
                    <li>Outside Dhaka: 120 TK delivery charge</li>
                    <li>Delivery time: 2-5 business days</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <div className="space-y-6">
              {/* Review Summary */}
              <div className="flex items-center gap-6 p-6 bg-muted rounded-lg">
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
                <div className="space-y-4">
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
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-4 lg:gap-6">
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
