import { Construction } from "lucide-react";
import logo from "@/assets/logo.png";

const UnderConstruction = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src={logo} 
            alt="YUKON Lifestyle" 
            className="h-16 md:h-20 object-contain"
          />
        </div>

        {/* Construction Icon */}
        <div className="flex justify-center">
          <div className="bg-primary/10 p-6 rounded-full">
            <Construction className="h-16 w-16 md:h-20 md:w-20 text-primary" />
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Site Under Construction
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            We're currently performing maintenance and upgrading our services for you.
          </p>
          <p className="text-base md:text-lg text-muted-foreground">
            Please check back soon!
          </p>
        </div>

        {/* Contact Information */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            For inquiries, please contact us
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnderConstruction;
