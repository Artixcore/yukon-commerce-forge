import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_location: string;
  total_amount: number;
  created_at: string;
}

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching order:", error);
        }
      } else {
        setOrder(data as any);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg mb-4">Order not found</p>
        <Link to="/shop">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const estimatedDays = (order as any).delivery_location === "inside_dhaka" ? "3-5" : "5-7";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle2 className="w-20 h-20 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Thank you for your order, {order.customer_name}
        </p>

        <div className="bg-muted rounded-lg p-6 mb-8 text-left">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Number:</span>
              <span className="font-semibold">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Total:</span>
              <span className="font-semibold">৳{Number(order.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-semibold">Cash on Delivery</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact Number:</span>
              <span className="font-semibold">{order.customer_phone}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h2 className="font-semibold mb-2">Estimated Delivery</h2>
          <p className="text-muted-foreground">
            Your order will be delivered within {estimatedDays} business days
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We will contact you at {order.customer_phone} to confirm your order
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link to="/shop">
              <Button variant="default" size="lg">
                Continue Shopping
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="lg">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          <p>For any queries, please contact us with your order number</p>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
