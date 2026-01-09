import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface Product {
  id: string;
  product_id: string | null;
  custom_name: string | null;
  custom_price: number | null;
  custom_original_price: number | null;
  custom_image_url: string | null;
  display_order: number;
  products: {
    id: string;
    name: string;
    price: number;
    original_price: number | null;
    image_url: string | null;
    slug: string;
  } | null;
}

interface LandingProductsSectionProps {
  products: Product[];
  quantities: Record<string, number>;
  onQuantityChange: (productId: string, quantity: number) => void;
}

export function LandingProductsSection({
  products,
  quantities,
  onQuantityChange,
}: LandingProductsSectionProps) {
  return (
    <section className="py-16 bg-[#1a1a2e]">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
          আমাদের প্রোডাক্ট সমূহ
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((item) => {
            const name = item.custom_name || item.products?.name || "Product";
            const price = item.custom_price || item.products?.price || 0;
            const originalPrice = item.custom_original_price || item.products?.original_price;
            const image = item.custom_image_url || item.products?.image_url;
            const quantity = quantities[item.id] || 0;
            const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

            return (
              <div
                key={item.id}
                className="bg-[#252547] rounded-xl overflow-hidden border border-gray-700/50 hover:border-primary/50 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative aspect-square">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                  {discount > 0 && (
                    <div className="absolute top-3 left-3 bg-primary text-white text-sm font-bold px-3 py-1 rounded-full">
                      -{discount}%
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{name}</h3>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold text-primary">৳{price}</span>
                    {originalPrice && originalPrice > price && (
                      <span className="text-gray-400 line-through">৳{originalPrice}</span>
                    )}
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between bg-[#1a1a2e] rounded-lg p-2">
                    <span className="text-sm text-gray-400">পরিমাণ</span>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full border-gray-600"
                        onClick={() => onQuantityChange(item.id, quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full border-gray-600"
                        onClick={() => onQuantityChange(item.id, quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
