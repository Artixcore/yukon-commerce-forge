import { Truck, Shield, Headphones, CreditCard } from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
      description: "On orders over ৳2000",
    },
    {
      icon: Shield,
      title: "Secure Payment",
      description: "100% secure transactions",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Dedicated customer service",
    },
    {
      icon: CreditCard,
      title: "Easy Returns",
      description: "30-day return policy",
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
