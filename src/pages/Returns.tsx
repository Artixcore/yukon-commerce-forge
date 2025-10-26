import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

const Returns = () => {
  const eligibleItems = [
    "Defective or damaged products",
    "Wrong items delivered",
    "Products significantly different from description",
    "Unused items in original packaging (within 7 days)",
  ];

  const nonEligibleItems = [
    "Products used or damaged by customer",
    "Items without original packaging",
    "Products returned after 7 days",
    "Personalized or custom-made items",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Return Policy</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We want you to be completely satisfied with your purchase
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Return Window */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Return Window</h2>
            <p className="text-muted-foreground">
              You have <strong>7 days</strong> from the date of delivery to return eligible items. 
              The product must be unused and in its original packaging with all tags attached.
            </p>
          </Card>

          {/* Eligible Items */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Eligible for Return</h2>
            <ul className="space-y-3">
              {eligibleItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Non-Eligible Items */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Not Eligible for Return</h2>
            <ul className="space-y-3">
              {nonEligibleItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Return Process */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">How to Return</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Step 1: Contact Us</h3>
                <p>Reach out to our customer support team via phone, email, or contact form with your order number and reason for return.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Step 2: Get Approval</h3>
                <p>Our team will review your request and provide return instructions within 24 hours.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Step 3: Ship the Item</h3>
                <p>Pack the item securely in its original packaging and ship it to the address provided by our team.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Step 4: Receive Refund</h3>
                <p>Once we receive and inspect the item, your refund will be processed within 5-7 business days.</p>
              </div>
            </div>
          </Card>

          {/* Refund Information */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Refund Information</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong>Refund Method:</strong> Refunds will be issued to the original payment method used for the purchase.
              </p>
              <p>
                <strong>Processing Time:</strong> Please allow 5-7 business days for the refund to appear in your account after approval.
              </p>
              <p>
                <strong>Shipping Costs:</strong> Original shipping costs are non-refundable unless the return is due to our error.
              </p>
            </div>
          </Card>

          {/* Contact Section */}
          <Card className="p-8 bg-primary/5 text-center">
            <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
            <p className="text-muted-foreground mb-6">
              Have questions about our return policy? Our customer support team is here to help.
            </p>
            <a 
              href="/contact" 
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium"
            >
              Contact Support
            </a>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Returns;
