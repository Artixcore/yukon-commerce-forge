import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { showSuccess } from "@/lib/sweetalert";
import { ImageUpload } from "./ImageUpload";
import { X, GripVertical, Plus } from "lucide-react";
import { getCategoryPath, getCategoriesForSelect } from "@/lib/categoryUtils";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  original_price: z.string().optional(),
  discount_percentage: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  stock_quantity: z.string().min(0, "Stock quantity must be positive"),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  image_url: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  colors: z.array(z.object({
    name: z.string(),
    hex: z.string()
  })).optional(),
  sizes: z.array(z.string()).optional(),
  size_chart: z.array(z.object({
    size: z.string(),
    length: z.string(),
    chest: z.string(),
    sleeve: z.string()
  })).optional(),
});

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

type ProductForm = z.infer<typeof productSchema>;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
}

export const ProductDialog = ({ open, onOpenChange, product }: ProductDialogProps) => {
  const queryClient = useQueryClient();
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [colors, setColors] = useState<Array<{name: string, hex: string}>>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeChart, setSizeChart] = useState<Array<{size: string, length: string, chest: string, sleeve: string}>>([]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: "",
      original_price: "",
      discount_percentage: "",
      category_id: "",
      stock_quantity: "0",
      is_featured: false,
      is_active: true,
      image_url: "",
      images: [],
      colors: [],
      sizes: [],
      size_chart: [],
    },
  });

  // Watch name field to auto-generate slug
  const watchName = form.watch("name");
  useEffect(() => {
    if (!product && watchName) {
      form.setValue("slug", generateSlug(watchName));
    }
  }, [watchName, product, form]);

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        price: product.price.toString(),
        original_price: product.original_price?.toString() || "",
        discount_percentage: product.discount_percentage?.toString() || "",
        category_id: product.category_id,
        stock_quantity: product.stock_quantity.toString(),
        is_featured: product.is_featured,
        is_active: product.is_active,
        image_url: product.image_url || "",
        images: product.images || [],
        colors: product.colors || [],
        sizes: product.sizes || [],
        size_chart: product.size_chart || [],
      });
      setAdditionalImages(product.images || []);
      setColors(product.colors || []);
      setSizes(product.sizes || []);
      setSizeChart(product.size_chart || []);
    } else {
      form.reset();
      setAdditionalImages([]);
      setColors([]);
      setSizes([]);
      setSizeChart([]);
    }
  }, [product, form]);

  const mutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const productData = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        price: parseFloat(data.price),
        original_price: data.original_price ? parseFloat(data.original_price) : null,
        discount_percentage: data.discount_percentage ? parseInt(data.discount_percentage) : null,
        category_id: data.category_id,
        stock_quantity: parseInt(data.stock_quantity),
        is_featured: data.is_featured,
        is_active: data.is_active,
        image_url: data.image_url || null,
        images: additionalImages.filter(img => img.trim() !== ""),
        colors: colors.length > 0 ? colors : [],
        sizes: sizes.length > 0 ? sizes : [],
        size_chart: sizeChart.length > 0 ? sizeChart : [],
      };

      if (product) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert([productData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      showSuccess(
        product ? "Updated!" : "Created!",
        product ? "Product updated successfully" : "Product created successfully"
      );
      onOpenChange(false);
      form.reset();
    },
  });

  const onSubmit = (data: ProductForm) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="original_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Price (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} placeholder="Before discount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount % (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" {...field} placeholder="0-100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {product && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                  <div className="text-lg font-semibold">
                    {product.rating?.toFixed(1) || "No ratings"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Reviews</div>
                  <div className="text-lg font-semibold">
                    {product.review_count || 0}
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => {
                const selectedCategory = categories?.find(c => c.id === field.value);
                const categoryPath = selectedCategory 
                  ? getCategoryPath(selectedCategory.id, categories || [])
                  : [];
                
                return (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category">
                            {selectedCategory && categoryPath.length > 0 && (
                              <span className="flex items-center gap-1">
                                {categoryPath.join(' › ')}
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getCategoriesForSelect(categories || []).map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value || ""}
                      onChange={field.onChange}
                      folder="products"
                      label="Upload featured image"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Additional Images</FormLabel>
              {additionalImages.map((img, index) => (
                <div key={index} className="space-y-2">
                  <ImageUpload
                    value={img}
                    onChange={(url) => {
                      const newImages = [...additionalImages];
                      newImages[index] = url;
                      setAdditionalImages(newImages);
                    }}
                    folder="products"
                    label={`Additional image ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newImages = additionalImages.filter((_, i) => i !== index);
                      setAdditionalImages(newImages);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdditionalImages([...additionalImages, ""])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </div>

            {/* Color Selector */}
            <div className="space-y-3">
              <FormLabel>Colors (Optional)</FormLabel>
              <div className="space-y-2">
                {colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={color.name}
                      onChange={(e) => {
                        const newColors = [...colors];
                        newColors[index].name = e.target.value;
                        setColors(newColors);
                      }}
                      placeholder="Color name"
                      className="flex-1"
                    />
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => {
                        const newColors = [...colors];
                        newColors[index].hex = e.target.value;
                        setColors(newColors);
                      }}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setColors(colors.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setColors([...colors, { name: "", hex: "#000000" }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Color
                </Button>
              </div>
            </div>

            {/* Size Selector */}
            <div className="space-y-3">
              <FormLabel>Sizes (Optional)</FormLabel>
              <div className="flex flex-wrap gap-2">
                {["XS", "S", "M", "L", "XL", "2XL", "3XL"].map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={sizes.includes(size) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (sizes.includes(size)) {
                        setSizes(sizes.filter(s => s !== size));
                        setSizeChart(sizeChart.filter(sc => sc.size !== size));
                      } else {
                        setSizes([...sizes, size]);
                        setSizeChart([...sizeChart, { size, length: "", chest: "", sleeve: "" }]);
                      }
                    }}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Size Chart */}
            {sizes.length > 0 && (
              <div className="space-y-3">
                <FormLabel>Size Chart (inches)</FormLabel>
                <div className="border rounded-lg p-4 space-y-3">
                  {sizeChart.map((chart, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-center">
                      <div className="font-medium">{chart.size}</div>
                      <Input
                        placeholder="Length"
                        value={chart.length}
                        onChange={(e) => {
                          const newChart = [...sizeChart];
                          newChart[index].length = e.target.value;
                          setSizeChart(newChart);
                        }}
                      />
                      <Input
                        placeholder="Chest"
                        value={chart.chest}
                        onChange={(e) => {
                          const newChart = [...sizeChart];
                          newChart[index].chest = e.target.value;
                          setSizeChart(newChart);
                        }}
                      />
                      <Input
                        placeholder="Sleeve"
                        value={chart.sleeve}
                        onChange={(e) => {
                          const newChart = [...sizeChart];
                          newChart[index].sleeve = e.target.value;
                          setSizeChart(newChart);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel>Featured</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
