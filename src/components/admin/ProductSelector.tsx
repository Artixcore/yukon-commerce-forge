import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Search, GripVertical } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface SelectedProduct {
  product_id: string | null;
  custom_name?: string;
  custom_price?: number;
  custom_original_price?: number;
  custom_image_url?: string;
  display_order: number;
}

interface ProductSelectorProps {
  selectedProducts: SelectedProduct[];
  onProductsChange: (products: SelectedProduct[]) => void;
}

export function ProductSelector({ selectedProducts, onProductsChange }: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customProduct, setCustomProduct] = useState<Partial<SelectedProduct>>({});

  const { data: products, isLoading } = useQuery({
    queryKey: ["products-for-selection"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, original_price, image_url, slug")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleProduct = (productId: string) => {
    const exists = selectedProducts.find(p => p.product_id === productId);
    if (exists) {
      onProductsChange(selectedProducts.filter(p => p.product_id !== productId));
    } else {
      onProductsChange([
        ...selectedProducts,
        { product_id: productId, display_order: selectedProducts.length },
      ]);
    }
  };

  const updateProductOverride = (productId: string | null, field: keyof SelectedProduct, value: any) => {
    onProductsChange(
      selectedProducts.map(p =>
        p.product_id === productId ? { ...p, [field]: value } : p
      )
    );
  };

  const removeProduct = (productId: string | null) => {
    onProductsChange(selectedProducts.filter(p => p.product_id !== productId));
  };

  const addCustomProduct = () => {
    if (customProduct.custom_name && customProduct.custom_price) {
      onProductsChange([
        ...selectedProducts,
        {
          product_id: null,
          custom_name: customProduct.custom_name,
          custom_price: customProduct.custom_price,
          custom_original_price: customProduct.custom_original_price,
          custom_image_url: customProduct.custom_image_url,
          display_order: selectedProducts.length,
        },
      ]);
      setCustomProduct({});
      setShowCustomForm(false);
    }
  };

  const getProductDetails = (productId: string | null) => {
    if (!productId) return null;
    return products?.find(p => p.id === productId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <Label>Select Products</Label>
          <p className="text-sm text-muted-foreground">Choose products to display on the landing page</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setShowCustomForm(!showCustomForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Custom Product
        </Button>
      </div>

      {/* Custom Product Form */}
      {showCustomForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
          <h4 className="font-medium">Add Custom Product</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={customProduct.custom_name || ""}
                onChange={(e) => setCustomProduct({ ...customProduct, custom_name: e.target.value })}
                placeholder="Product name"
              />
            </div>
            <div>
              <Label>Price *</Label>
              <Input
                type="number"
                value={customProduct.custom_price || ""}
                onChange={(e) => setCustomProduct({ ...customProduct, custom_price: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Original Price</Label>
              <Input
                type="number"
                value={customProduct.custom_original_price || ""}
                onChange={(e) => setCustomProduct({ ...customProduct, custom_original_price: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <Label>Product Image</Label>
            <ImageUpload
              value={customProduct.custom_image_url || ""}
              onChange={(url) => setCustomProduct({ ...customProduct, custom_image_url: url })}
              folder="landing-pages"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={addCustomProduct}>Add Product</Button>
            <Button type="button" variant="outline" onClick={() => setShowCustomForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="pl-10"
        />
      </div>

      {/* Product List */}
      <ScrollArea className="h-48 border rounded-lg p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-1">
            {filteredProducts?.map((product) => {
              const isSelected = selectedProducts.some(p => p.product_id === product.id);
              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={() => toggleProduct(product.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">৳{product.price}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Selected Products with Override Options */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Products ({selectedProducts.length})</Label>
          <div className="space-y-2">
            {selectedProducts.map((selected, index) => {
              const product = getProductDetails(selected.product_id);
              const displayName = selected.custom_name || product?.name || "Custom Product";
              const displayPrice = selected.custom_price || product?.price;
              const displayImage = selected.custom_image_url || product?.image_url;
              // Generate a stable key - use product_id if available, otherwise use index with custom prefix
              const itemKey = selected.product_id || `custom-${index}-${selected.custom_name || 'product'}`;

              return (
                <Collapsible key={itemKey} defaultOpen={false}>
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <img
                        src={displayImage || "/placeholder.svg"}
                        alt={displayName}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{displayName}</p>
                        <p className="text-sm text-muted-foreground">৳{displayPrice}</p>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button type="button" variant="ghost" size="icon">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeProduct(selected.product_id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <CollapsibleContent className="mt-3 pt-3 border-t space-y-3">
                      <p className="text-sm text-muted-foreground">Override settings for this landing page</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Custom Price</Label>
                          <Input
                            type="number"
                            value={selected.custom_price || ""}
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : Number(e.target.value);
                              updateProductOverride(selected.product_id, "custom_price", value);
                            }}
                            placeholder={product?.price?.toString() || "Price"}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Custom Original Price</Label>
                          <Input
                            type="number"
                            value={selected.custom_original_price || ""}
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : Number(e.target.value);
                              updateProductOverride(selected.product_id, "custom_original_price", value);
                            }}
                            placeholder={product?.original_price?.toString() || "Original"}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Custom Name</Label>
                          <Input
                            value={selected.custom_name || ""}
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : e.target.value;
                              updateProductOverride(selected.product_id, "custom_name", value);
                            }}
                            placeholder={product?.name || "Product name"}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Custom Image</Label>
                          <ImageUpload
                            value={selected.custom_image_url || ""}
                            onChange={(url) => updateProductOverride(selected.product_id, "custom_image_url", url || undefined)}
                            folder="landing-pages"
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
