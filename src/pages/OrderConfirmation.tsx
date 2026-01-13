import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackMetaEvent } from "@/lib/metaTracking";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_location: string;
  total_amount: number;
  delivery_charge: number;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'router' | 'localStorage' | 'api' | null>(null);

  // Load order data from multiple sources with priority
  useEffect(() => {
    const loadOrderData = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      // Priority 1: Check router state (fastest, no API call)
      if (location.state?.order && location.state?.orderItems) {
        const routerOrder = location.state.order;
        const routerItems = location.state.orderItems;
        
        setOrder({
          id: routerOrder.id,
          order_number: routerOrder.order_number,
          customer_name: routerOrder.customer_name,
          customer_phone: routerOrder.customer_phone,
          delivery_location: routerOrder.delivery_location,
          total_amount: routerOrder.total_amount,
          delivery_charge: routerOrder.delivery_charge,
          created_at: routerOrder.created_at,
        });
        setOrderItems(routerItems);
        setDataSource('router');
        setLoading(false);
        
        // Track Purchase event
        trackMetaEvent('Purchase', {
          value: routerOrder.total_amount,
          currency: 'BDT',
          num_items: routerItems.length,
        }, {
          ph: routerOrder.customer_phone,
        });
        return;
      }

      // Priority 2: Check localStorage (works on refresh)
      try {
        const storedData = localStorage.getItem(`lastOrderConfirmation_${orderId}`);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          if (parsed.orderId === orderId && parsed.items && parsed.items.length > 0) {
            setOrder({
              id: parsed.orderId,
              order_number: parsed.orderNumber,
              customer_name: parsed.customer_name,
              customer_phone: parsed.customer_phone,
              delivery_location: parsed.delivery_location,
              total_amount: parsed.total_amount,
              delivery_charge: parsed.delivery_charge,
              created_at: parsed.created_at,
            });
            setOrderItems(parsed.items);
            setDataSource('localStorage');
            setLoading(false);
            
            // Track Purchase event
            trackMetaEvent('Purchase', {
              value: parsed.total_amount,
              currency: 'BDT',
              num_items: parsed.items.length,
            }, {
              ph: parsed.customer_phone,
            });
            return;
          }
        }
      } catch (storageError) {
        console.warn('Failed to read from localStorage:', storageError);
      }

      // Priority 3: Fetch from API (fallback)
      await fetchOrderFromAPI();
    };

    loadOrderData();
  }, [orderId, location.state]);

  const fetchOrderFromAPI = async () => {
    if (!orderId) return;

    try {
      setFetchError(null);
      setDataSource('api');

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Order not found in database');
      }

      setOrder(data as any);
      
      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      
      if (itemsError) {
        console.error("Error fetching order items:", itemsError);
        // Still show order even if items fail
        setOrderItems([]);
      } else {
        setOrderItems(items || []);
      }
      
      // Track Purchase event with Meta Conversion API
      trackMetaEvent('Purchase', {
        value: data.total_amount,
        currency: 'BDT',
        num_items: items?.length || 0,
      }, {
        ph: data.customer_phone,
      });

      // Clear localStorage after successful API fetch (cleanup)
      try {
        localStorage.removeItem(`lastOrderConfirmation_${orderId}`);
      } catch (cleanupError) {
        console.warn('Failed to clear localStorage:', cleanupError);
      }
    } catch (error: any) {
      console.error("Error fetching order:", error);
      setFetchError(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };


  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-lg">Loading order details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Show error with retry option
  if (fetchError && !order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-6 flex justify-center">
              <CheckCircle2 className="w-20 h-20 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">We couldn't load your order</h1>
            <p className="text-lg text-muted-foreground mb-8">
              {fetchError}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={fetchOrderFromAPI} size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Link to="/shop">
                <Button variant="outline" size="lg">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show "Order not found" only as last resort
  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-lg mb-4">Order not found</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={fetchOrderFromAPI}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Link to="/shop">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </div>
        <Footer />
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
        
        <h1 className="text-3xl font-bold mb-4">Your order has been placed!</h1>
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
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-semibold">Cash on Delivery</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact Number:</span>
              <span className="font-semibold">{order.customer_phone}</span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        {(orderItems.length > 0 || order.total_amount) && (
          <div className="bg-muted rounded-lg p-6 mb-8 text-left">
            {orderItems.length > 0 && (
              <>
                <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start py-2 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × ৳{Number(item.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ৳{(Number(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {/* Pricing Breakdown - Always show if we have order data */}
            <div className={`${orderItems.length > 0 ? 'mt-4 pt-4 border-t' : ''} space-y-2`}>
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span>৳{(Number(order.total_amount) - Number(order.delivery_charge || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Charge:</span>
                <span>৳{Number(order.delivery_charge || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total Amount:</span>
                <span>৳{Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

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
