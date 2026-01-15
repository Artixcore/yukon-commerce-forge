import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import { ProductDialog } from "@/components/admin/ProductDialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showSuccess, showConfirmation, showInfo } from "@/lib/sweetalert";

const Products = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      showSuccess("Deleted!", "Product has been deleted successfully");
    },
  });

  const toggleProductSelection = (productId: string, checked: boolean) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean, productIds: string[]) => {
    if (checked) {
      setSelectedProducts(new Set(productIds));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleBulkDelete = async (productIds: string[]) => {
    const confirmed = await showConfirmation(
      "Delete Products?",
      `You are about to delete ${productIds.length} products. This action cannot be undone.`,
      "Yes, delete them!"
    );
    if (confirmed) {
      const { error } = await supabase.from("products").delete().in("id", productIds);
      if (error) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setSelectedProducts(new Set());
      showSuccess("Deleted!", "Selected products have been deleted successfully");
    }
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmation(
      'Delete Product?',
      'This action cannot be undone. The product will be permanently deleted.',
      'Yes, delete it!'
    );
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold">Products</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            disabled={selectedProducts.size === 0}
            onClick={() => handleBulkDelete(Array.from(selectedProducts))}
          >
            Bulk Delete
          </Button>
          <Button onClick={() => {
            setSelectedProduct(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="text-sm md:text-base">Add Product</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={products?.length > 0 && selectedProducts.size === products.length}
                    onCheckedChange={(checked) => toggleSelectAll(Boolean(checked), products?.map((p) => p.id) || [])}
                    aria-label="Select all products"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Product Code</TableHead>
                <TableHead className="hidden md:table-cell">Slug</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden lg:table-cell">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={(checked) => toggleProductSelection(product.id, Boolean(checked))}
                      aria-label={`Select product ${product.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {product.product_code || "—"}
                      </code>
                      {product.product_code && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            await navigator.clipboard.writeText(product.product_code);
                            showInfo("Copied!", "Product code copied to clipboard");
                          }}
                        >
                          <Copy className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {product.slug}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          await navigator.clipboard.writeText(product.slug);
                          showInfo("Copied!", "Slug copied to clipboard");
                        }}
                      >
                        <Copy className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{product.categories?.name}</TableCell>
                  <TableCell>৳{product.price}</TableCell>
                  <TableCell className="hidden lg:table-cell">{product.stock_quantity}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.is_active 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
      />
    </div>
  );
};

export default Products;
