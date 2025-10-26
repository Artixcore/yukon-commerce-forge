import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, CheckCircle, Truck, Clock } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const trackOrderSchema = z.object({
  orderNumber: z.string()
    .trim()
    .min(5, "Order number is too short")
    .max(50, "Order number is too long")
    .regex(/^ORD-[0-9a-zA-Z-]+$/, "Invalid order number format")
});

type TrackOrderForm = z.infer<typeof trackOrderSchema>;

const Track = () => {
  const [searchOrderNumber, setSearchOrderNumber] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackOrderForm>({
    resolver: zodResolver(trackOrderSchema),
  });

  const { data: order, isLoading } = useQuery({
    queryKey: ["track-order", searchOrderNumber],
    queryFn: async () => {
      if (!searchOrderNumber) return null;
      
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", searchOrderNumber)
        .maybeSingle();
      
      if (error) {
        toast.error("Error fetching order");
        throw error;
      }
      
      if (!data) {
        toast.error("Order not found");
        return null;
      }
      
      return data;
    },
    enabled: !!searchOrderNumber,
  });

  const onSubmit = (data: TrackOrderForm) => {
    setSearchOrderNumber(data.orderNumber.trim());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case "processing":
        return <Package className="h-6 w-6 text-blue-500" />;
      case "shipped":
        return <Truck className="h-6 w-6 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "cancelled":
        return <Clock className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Track Your Order</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enter your order number to check the status of your delivery
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="p-8 mb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="orderNumber">Order Number</Label>
                <Input
                  id="orderNumber"
                  {...register("orderNumber")}
                  placeholder="Enter your order number (e.g., ORD-12345)"
                />
                {errors.orderNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.orderNumber.message}</p>
                )}
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Searching..." : "Track Order"}
              </Button>
            </form>
          </Card>

          {order && (
            <Card className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h2 className="text-2xl font-bold">Order #{order.order_number}</h2>
                    <p className="text-muted-foreground">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="font-semibold capitalize">{order.status}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Customer Information</h3>
                    <p className="text-muted-foreground">{order.customer_name}</p>
                    <p className="text-muted-foreground">{order.customer_phone}</p>
                    {order.customer_email && (
                      <p className="text-muted-foreground">{order.customer_email}</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <p className="text-muted-foreground">{order.shipping_address}</p>
                    <p className="text-muted-foreground">{order.city}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Order Total</h3>
                    <p className="text-2xl font-bold text-primary">৳{order.total_amount}</p>
                  </div>

                  {order.message && (
                    <div>
                      <h3 className="font-semibold mb-2">Note</h3>
                      <p className="text-muted-foreground">{order.message}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-4">Order Status Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Order Placed</span>
                    </div>
                    <div className={`flex items-center gap-3 ${order.status === 'pending' ? 'text-muted-foreground' : ''}`}>
                      <Package className={`h-5 w-5 ${order.status !== 'pending' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <span>Processing</span>
                    </div>
                    <div className={`flex items-center gap-3 ${['pending', 'processing'].includes(order.status) ? 'text-muted-foreground' : ''}`}>
                      <Truck className={`h-5 w-5 ${order.status === 'shipped' || order.status === 'delivered' ? 'text-purple-500' : 'text-muted-foreground'}`} />
                      <span>Shipped</span>
                    </div>
                    <div className={`flex items-center gap-3 ${order.status !== 'delivered' ? 'text-muted-foreground' : ''}`}>
                      <CheckCircle className={`h-5 w-5 ${order.status === 'delivered' ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span>Delivered</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Track;
