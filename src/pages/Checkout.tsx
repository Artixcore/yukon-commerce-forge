import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const checkoutSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[\p{L}\s'-]+$/u, "Name contains invalid characters"),
  phone: z.string()
    .regex(/^(\+8801|01)[3-9]\d{8}$/, "Please enter a valid Bangladesh phone number (e.g., 01XXXXXXXXX)"),
  city: z.string()
    .trim()
    .min(2, "City is required")
    .max(100, "City name is too long"),
  deliveryLocation: z.enum(["inside_dhaka", "outside_dhaka"]),
  address: z.string()
    .trim()
    .min(10, "Please provide a complete address")
    .max(500, "Address is too long"),
  message: z.string()
    .trim()
    .max(1000, "Message is too long")
    .optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryLocation: "inside_dhaka",
    },
  });

  const deliveryLocation = watch("deliveryLocation");
  const deliveryCharge = deliveryLocation === "inside_dhaka" ? 60 : 120;
  const finalTotal = total + deliveryCharge;

  const onSubmit = async (data: CheckoutForm) => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customer_name: data.name,
        customer_phone: data.phone,
        customer_email: null,
        city: data.city,
        delivery_location: data.deliveryLocation,
        shipping_address: data.address,
        message: data.message || null,
        total_amount: finalTotal,
        delivery_charge: deliveryCharge,
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          product_color: item.variants?.color || null,
          product_size: item.variants?.size || null,
        })),
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(orderData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place order');
      }

      const { order } = await response.json();

      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/order-confirmation/${order.id}`);
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate("/shop");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Shipping Form */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Shipping Information</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="01XXXXXXXXX"
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="Enter your city"
              />
              {errors.city && (
                <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
              )}
            </div>

            <div>
              <Label>Delivery Location *</Label>
              <RadioGroup
                defaultValue="inside_dhaka"
                onValueChange={(value) => register("deliveryLocation").onChange({ target: { value } })}
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="inside_dhaka" id="inside_dhaka" {...register("deliveryLocation")} />
                  <Label htmlFor="inside_dhaka" className="cursor-pointer flex-1">
                    Inside Dhaka (৳60 delivery charge)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="outside_dhaka" id="outside_dhaka" {...register("deliveryLocation")} />
                  <Label htmlFor="outside_dhaka" className="cursor-pointer flex-1">
                    Outside Dhaka (৳120 delivery charge)
                  </Label>
                </div>
              </RadioGroup>
              {errors.deliveryLocation && (
                <p className="text-sm text-destructive mt-1">{errors.deliveryLocation.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address">Full Address *</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="House/Flat no, Road, Area, Landmark"
                rows={3}
              />
              {errors.address && (
                <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="message">Special Instructions (Optional)</Label>
              <Textarea
                id="message"
                {...register("message")}
                placeholder="Any special instructions for delivery"
                rows={2}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Place Order"}
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>
            <div className="bg-muted rounded-lg p-6 space-y-4">
            {items.map((item, index) => (
              <div key={`${item.product.id}-${item.variants?.color}-${item.variants?.size}-${index}`} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {item.quantity}
                    {item.variants?.color && ` • Color: ${item.variants.color}`}
                    {item.variants?.size && ` • Size: ${item.variants.size}`}
                  </p>
                </div>
                <p className="font-medium">৳{(Number(item.product.price) * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>৳{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Charge</span>
                <span>৳{deliveryCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>Total</span>
                <span>৳{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-background rounded p-4 text-sm">
              <p className="font-semibold mb-2">Payment Method:</p>
              <p className="text-muted-foreground">Cash on Delivery (COD)</p>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
