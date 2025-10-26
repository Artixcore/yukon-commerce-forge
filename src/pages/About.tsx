import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Users, Target, Heart, Award } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Users,
      title: "Customer First",
      description: "We prioritize customer satisfaction above everything else",
    },
    {
      icon: Target,
      title: "Quality Products",
      description: "We ensure every product meets our high quality standards",
    },
    {
      icon: Heart,
      title: "Passion",
      description: "We love what we do and it shows in our service",
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We strive for excellence in every aspect of our business",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your trusted e-commerce partner in Bangladesh, delivering quality products and exceptional service
          </p>
        </div>

        {/* Story Section */}
        <div className="mb-16">
          <Card className="p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Welcome to our e-commerce platform, where we bring you the best products from around Bangladesh and beyond. 
                Founded with a vision to make online shopping accessible, reliable, and enjoyable for everyone.
              </p>
              <p>
                We started our journey with a simple mission: to provide quality products at competitive prices 
                with exceptional customer service. Today, we serve thousands of satisfied customers across Bangladesh.
              </p>
              <p>
                Our team works tirelessly to curate the best products, ensure timely delivery, and provide 
                support whenever you need it. We believe in building long-term relationships with our customers 
                based on trust and quality.
              </p>
            </div>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <Card className="p-8 md:p-12 bg-primary/5">
            <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Have questions or feedback? We'd love to hear from you. 
              Visit our contact page or reach out through our customer support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/contact" 
                className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium"
              >
                Contact Us
              </a>
              <a 
                href="/shop" 
                className="inline-block px-8 py-3 border border-primary text-primary rounded hover:bg-primary/10 transition-colors font-medium"
              >
                Shop Now
              </a>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
