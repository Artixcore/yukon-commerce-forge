import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BestSelling } from "@/components/home/BestSelling";
import { Features } from "@/components/home/Features";
import { ProductGallery } from "@/components/home/ProductGallery";
import { CustomerReviews } from "@/components/home/CustomerReviews";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeaturedProducts />
      <BestSelling />
      <Features />
      <ProductGallery />
      <CustomerReviews />
      <Footer />
    </div>
  );
};

export default Index;
