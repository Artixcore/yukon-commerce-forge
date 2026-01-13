import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showSuccess, showError } from "@/lib/sweetalert";
import { useState } from "react";
import { Phone, MapPin, MessageSquare } from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

interface UnifiedOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  city: string;
  delivery_location: string;
  shipping_address: string;
  message: string | null;
  total_amount: number;
  delivery_charge: number;
  status: string;
  created_at: string;
  source: 'regular' | 'landing_page';
  landing_page_slug?: string;
  items?: any[];
}

interface OrderDetailDialogProps {
  order: UnifiedOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  processing: "bg-purple-500",
  shipped: "bg-orange-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const OrderDetailDialog = ({ order, open, onOpenChange }: OrderDetailDialogProps) => {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");

  // Fetch order items only for regular orders (LP orders have items embedded)
  const { data: orderItems } = useQuery({
    queryKey: ["order-items", order?.id, order?.source],
    queryFn: async () => {
      if (!order || order.source !== 'regular') return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);
      if (error) throw error;
      return data;
    },
    enabled: !!order && order.source === 'regular',
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: OrderStatus) => {
      if (!order) return;
      
      // Check if transitioning to cancelled status (restock logic)
      const isTransitioningToCancelled = status === "cancelled" && order.status !== "cancelled";
      
      if (isTransitioningToCancelled) {
        // Get order items based on order source
        let itemsToRestock: any[] = [];
        
        if (order.source === 'regular') {
          // Fetch order items for regular orders
          const { data: items, error: itemsError } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", order.id);
          
          if (itemsError) throw itemsError;
          itemsToRestock = items || [];
        } else {
          // Use embedded items for landing page orders
          itemsToRestock = order.items || [];
        }
        
        // Restock each product
        for (const item of itemsToRestock) {
          if (item.product_id && item.quantity > 0) {
            // Get current stock
            const { data: product, error: productError } = await supabase
              .from("products")
              .select("stock_quantity")
              .eq("id", item.product_id)
              .single();
            
            if (productError) {
              console.error(`Failed to fetch product ${item.product_id}:`, productError);
              continue; // Skip this item but continue with others
            }
            
            // Add quantity back to stock
            const { error: updateError } = await supabase
              .from("products")
              .update({ stock_quantity: (product.stock_quantity || 0) + item.quantity })
              .eq("id", item.product_id);
            
            if (updateError) {
              console.error(`Failed to restock product ${item.product_id}:`, updateError);
              // Continue with other items even if one fails
            }
          }
        }
      }
      
      // Update order status
      if (order.source === 'regular') {
        const { error } = await supabase
          .from("orders")
          .update({ status })
          .eq("id", order.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("landing_page_orders")
          .update({ status })
          .eq("id", order.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-landing-page-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] }); // Invalidate products to refresh stock
      showSuccess("Updated!", "Order status updated successfully");
    },
    onError: (error: any) => {
      showError("Update Failed", error.message || "Failed to update status");
    },
  });

  const handleStatusUpdate = () => {
    if (!newStatus) {
      showError("Invalid Selection", "Please select a status before updating");
      return;
    }
    updateStatusMutation.mutate(newStatus);
  };

  const handleContactCustomer = () => {
    if (order?.customer_phone) {
      const phone = order.customer_phone.replace(/\D/g, "");
      window.open(`tel:${phone}`, "_blank");
    }
  };

  if (!order) return null;

  const subtotal = order.total_amount - order.delivery_charge;
  
  // Get items based on order source
  const displayItems = order.source === 'landing_page' 
    ? (order.items || []) 
    : (orderItems || []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            Order Details
            {order.source === 'landing_page' && (
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                LP-{order.landing_page_slug}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-semibold">{order.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-semibold">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">City</p>
              <p className="font-semibold">{order.city}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={statusColors[order.status]}>{statusLabels[order.status] || order.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Source</p>
              <p className="font-semibold">{order.source === 'landing_page' ? `Landing Page (${order.landing_page_slug})` : 'Website'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-semibold">Cash on Delivery</p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Customer Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{order.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">City:</span>
                <span className="font-medium">{order.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Location:</span>
                <span className="font-medium">
                  {order.delivery_location === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"}
                </span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-1">Address:</p>
                <p className="font-medium">{order.shipping_address}</p>
              </div>
              {order.message && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Special Instructions:
                  </p>
                  <p className="font-medium text-sm">{order.message}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Order Items</h3>
            <div className="space-y-3">
              {displayItems.map((item: any, index: number) => (
                <div key={item.id || index} className="flex justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">৳{Number(item.price).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Total: ৳{(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              {displayItems.length === 0 && (
                <p className="text-muted-foreground text-sm">No items found</p>
              )}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="border rounded-lg p-4 bg-muted">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Charge:</span>
                <span className="font-medium">৳{Number(order.delivery_charge).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total Amount:</span>
                <span>৳{Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Admin Actions</h3>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleStatusUpdate} disabled={updateStatusMutation.isPending}>
                  Update Status
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleContactCustomer}
              >
                <Phone className="w-4 h-4 mr-2" />
                Contact Customer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
