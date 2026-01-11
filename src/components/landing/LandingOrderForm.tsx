import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ShoppingBag, Truck, Shield, Plus, Minus } from "lucide-react";

const orderSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "নাম অবশ্যই দিতে হবে")
    .max(100, "নাম খুব বড়"),
  phone: z.string()
    .regex(/^(\+8801|01)[3-9]\d{8}$/, "সঠিক ফোন নম্বর দিন (01XXXXXXXXX)"),
  city: z.string()
    .trim()
    .min(2, "শহরের নাম দিন")
    .max(100, "শহরের নাম খুব বড়"),
  deliveryLocation: z.enum(["inside_dhaka", "outside_dhaka"]),
  address: z.string()
    .trim()
    .min(10, "সম্পূর্ণ ঠিকানা দিন")
    .max(500, "ঠিকানা খুব বড়"),
  message: z.string()
    .trim()
    .max(1000, "মেসেজ খুব বড়")
    .optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

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

interface LandingOrderFormProps {
  landingPage: {
    id: string;
    title: string;
    delivery_charge_inside: number;
    delivery_charge_outside: number;
    fb_pixel_id?: string | null;
    fb_access_token?: string | null;
    fb_test_event_code?: string | null;
    fb_dataset_id?: string | null;
  };
  products: Product[];
  quantities: Record<string, number>;
  onQuantityChange: (productId: string, quantity: number) => void;
}

export function LandingOrderForm({
  landingPage,
  products,
  quantities,
  onQuantityChange,
}: LandingOrderFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      deliveryLocation: "inside_dhaka",
    },
  });

  const deliveryLocation = watch("deliveryLocation");
  const deliveryCharge = deliveryLocation === "inside_dhaka" 
    ? landingPage.delivery_charge_inside 
    : landingPage.delivery_charge_outside;

  // Calculate selected items
  const selectedItems = products.filter(p => (quantities[p.id] || 0) > 0);
  
  const subtotal = selectedItems.reduce((sum, item) => {
    const price = item.custom_price || item.products?.price || 0;
    return sum + price * (quantities[item.id] || 0);
  }, 0);

  const total = subtotal + deliveryCharge;

  const onSubmit = async (data: OrderFormData) => {
    if (selectedItems.length === 0) {
      toast.error("অন্তত একটি প্রোডাক্ট সিলেক্ট করুন");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = selectedItems.map(item => ({
        product_id: item.product_id,
        product_name: item.custom_name || item.products?.name || "Product",
        quantity: quantities[item.id] || 0,
        price: item.custom_price || item.products?.price || 0,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-landing-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            landing_page_id: landingPage.id,
            customer_name: data.name,
            customer_phone: data.phone,
            city: data.city,
            delivery_location: data.deliveryLocation,
            shipping_address: data.address,
            message: data.message || null,
            total_amount: total,
            delivery_charge: deliveryCharge,
            items: orderItems,
            // Meta tracking data
            fb_pixel_id: landingPage.fb_pixel_id,
            fb_access_token: landingPage.fb_access_token,
            fb_test_event_code: landingPage.fb_test_event_code,
            fb_dataset_id: landingPage.fb_dataset_id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'অর্ডার প্লেস করতে সমস্যা হয়েছে');
      }

      const { order } = await response.json();

      // Track Purchase with client-side pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Purchase', {
          value: total,
          currency: 'BDT',
          content_ids: selectedItems.map(i => i.product_id || i.id),
          num_items: selectedItems.reduce((sum, i) => sum + (quantities[i.id] || 0), 0),
        });
      }

      toast.success("অর্ডার সফলভাবে প্লেস হয়েছে!");
      navigate(`/order-confirmation/${order.id}`);
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(error.message || "অর্ডার প্লেস করতে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 bg-[#16162a]" id="order-form">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
          এখনই অর্ডার করুন
        </h2>
        <p className="text-center text-gray-400 mb-10">
          ক্যাশ অন ডেলিভারি - পণ্য হাতে পেয়ে পেমেন্ট করুন
        </p>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Order Summary */}
          <div className="bg-[#252547] rounded-xl p-6 border border-gray-700/50 h-fit">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              আপনার অর্ডার
            </h3>

            {/* Selected Products */}
            <div className="space-y-3 mb-6">
              {products.map((item) => {
                const name = item.custom_name || item.products?.name || "Product";
                const price = item.custom_price || item.products?.price || 0;
                const image = item.custom_image_url || item.products?.image_url;
                const quantity = quantities[item.id] || 0;

                return (
                  <div key={item.id} className="flex items-center gap-3 bg-[#1a1a2e] rounded-lg p-3">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={name}
                      className="w-14 h-14 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{name}</p>
                      <p className="text-primary">৳{price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full border-gray-600"
                        onClick={() => onQuantityChange(item.id, quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center">{quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full border-gray-600"
                        onClick={() => onQuantityChange(item.id, quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-700 pt-4 space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>সাবটোটাল</span>
                <span>৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>ডেলিভারি চার্জ</span>
                <span>৳{deliveryCharge}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-700">
                <span>মোট</span>
                <span className="text-primary">৳{total}</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Truck className="h-5 w-5 text-primary" />
                <span>দ্রুত ডেলিভারি</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Shield className="h-5 w-5 text-primary" />
                <span>১০০% অরিজিনাল</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-[#252547] rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-semibold mb-4">ডেলিভারি তথ্য</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">আপনার নাম *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="আপনার সম্পূর্ণ নাম"
                  className="bg-[#1a1a2e] border-gray-700 focus:border-primary"
                />
                {errors.name && (
                  <p className="text-sm text-red-400 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-gray-300">ফোন নম্বর *</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="01XXXXXXXXX"
                  className="bg-[#1a1a2e] border-gray-700 focus:border-primary"
                />
                {errors.phone && (
                  <p className="text-sm text-red-400 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city" className="text-gray-300">শহর *</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="আপনার শহরের নাম"
                  className="bg-[#1a1a2e] border-gray-700 focus:border-primary"
                />
                {errors.city && (
                  <p className="text-sm text-red-400 mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <Label className="text-gray-300">ডেলিভারি এরিয়া *</Label>
                <Controller
                  name="deliveryLocation"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2 bg-[#1a1a2e] border border-gray-700 rounded-lg p-3">
                        <RadioGroupItem value="inside_dhaka" id="inside_dhaka" />
                        <Label htmlFor="inside_dhaka" className="cursor-pointer flex-1 text-gray-300">
                          ঢাকার ভিতরে (৳{landingPage.delivery_charge_inside})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-[#1a1a2e] border border-gray-700 rounded-lg p-3">
                        <RadioGroupItem value="outside_dhaka" id="outside_dhaka" />
                        <Label htmlFor="outside_dhaka" className="cursor-pointer flex-1 text-gray-300">
                          ঢাকার বাইরে (৳{landingPage.delivery_charge_outside})
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-gray-300">সম্পূর্ণ ঠিকানা *</Label>
                <Textarea
                  id="address"
                  {...register("address")}
                  placeholder="বাসা/ফ্ল্যাট নম্বর, রোড, এলাকা"
                  rows={3}
                  className="bg-[#1a1a2e] border-gray-700 focus:border-primary"
                />
                {errors.address && (
                  <p className="text-sm text-red-400 mt-1">{errors.address.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="message" className="text-gray-300">অতিরিক্ত মেসেজ (ঐচ্ছিক)</Label>
                <Textarea
                  id="message"
                  {...register("message")}
                  placeholder="ডেলিভারি সম্পর্কে কোনো বিশেষ নির্দেশনা"
                  rows={2}
                  className="bg-[#1a1a2e] border-gray-700 focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                disabled={isSubmitting || selectedItems.length === 0}
              >
                {isSubmitting ? "প্রসেসিং..." : `অর্ডার কনফার্ম করুন - ৳${total}`}
              </Button>

              <p className="text-center text-sm text-gray-400">
                ক্যাশ অন ডেলিভারি - পণ্য হাতে পেয়ে টাকা দিন
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
