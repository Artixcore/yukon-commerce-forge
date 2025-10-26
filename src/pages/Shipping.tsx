import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Truck, MapPin, Clock, Package } from "lucide-react";

const Shipping = () => {
  const shippingZones = [
    {
      zone: "Inside Dhaka",
      cost: "৳60",
      time: "1-2 business days",
      icon: MapPin,
    },
    {
      zone: "Outside Dhaka",
      cost: "৳120",
      time: "3-5 business days",
      icon: Truck,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shipping Information</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Fast and reliable delivery across Bangladesh
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Shipping Zones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shippingZones.map((zone, index) => {
              const Icon = zone.icon;
              return (
                <Card key={index} className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{zone.zone}</h3>
                  <p className="text-3xl font-bold text-primary mb-2">{zone.cost}</p>
                  <p className="text-muted-foreground">{zone.time}</p>
                </Card>
              );
            })}
          </div>

          {/* Free Shipping */}
          <Card className="p-8 bg-primary/5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Free Shipping</h3>
                <p className="text-muted-foreground">
                  Enjoy free shipping on all orders over <strong>৳2000</strong> anywhere in Bangladesh!
                </p>
              </div>
            </div>
          </Card>

          {/* Delivery Process */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Delivery Process</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Order Confirmation</h3>
                  <p className="text-muted-foreground">
                    Once you place your order, you'll receive a confirmation email with your order details.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Processing</h3>
                  <p className="text-muted-foreground">
                    We'll carefully pack your items and prepare them for shipment within 24 hours.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Shipping</h3>
                  <p className="text-muted-foreground">
                    Your order is handed over to our delivery partner and on its way to you.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Delivery</h3>
                  <p className="text-muted-foreground">
                    Your order arrives at your doorstep. Our delivery partner will contact you before delivery.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Order Tracking */}
          <Card className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Track Your Order</h3>
                <p className="text-muted-foreground mb-4">
                  Want to know where your order is? Use our order tracking feature to get real-time updates.
                </p>
                <a 
                  href="/track" 
                  className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium"
                >
                  Track Order
                </a>
              </div>
            </div>
          </Card>

          {/* FAQs */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Do you deliver on weekends?</h3>
                <p className="text-muted-foreground">
                  Yes, we deliver 6 days a week (Saturday to Thursday). We're closed on Fridays.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">What if I'm not home during delivery?</h3>
                <p className="text-muted-foreground">
                  Our delivery partner will contact you before delivery. If you're unavailable, they'll attempt redelivery at your convenience.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Can I change my delivery address?</h3>
                <p className="text-muted-foreground">
                  Yes, you can change your delivery address before the order is shipped. Contact our support team as soon as possible.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Do you ship internationally?</h3>
                <p className="text-muted-foreground">
                  Currently, we only ship within Bangladesh. International shipping is coming soon!
                </p>
              </div>
            </div>
          </Card>

          {/* Contact */}
          <Card className="p-8 bg-primary/5 text-center">
            <h2 className="text-2xl font-bold mb-4">Have More Questions?</h2>
            <p className="text-muted-foreground mb-6">
              Our customer support team is here to help with any shipping-related questions.
            </p>
            <a 
              href="/contact" 
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium"
            >
              Contact Us
            </a>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shipping;
