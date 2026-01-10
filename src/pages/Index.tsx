import { lazy, Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { FloatingCart } from "@/components/layout/FloatingCart";
import { HeroSection } from "@/components/home/HeroSection";
import { Features } from "@/components/home/Features";

// Lazy load below-fold sections
const FeaturedProducts = lazy(() => import("@/components/home/FeaturedProducts").then(m => ({ default: m.FeaturedProducts })));
const BestSelling = lazy(() => import("@/components/home/BestSelling").then(m => ({ default: m.BestSelling })));
const ProductGallery = lazy(() => import("@/components/home/ProductGallery").then(m => ({ default: m.ProductGallery })));
const CustomerReviews = lazy(() => import("@/components/home/CustomerReviews").then(m => ({ default: m.CustomerReviews })));

// Section loader
const SectionLoader = ({ height = "h-96" }: { height?: string }) => (
  <div className={`${height} animate-pulse bg-muted/30`} />
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <HeroSection />
      <Suspense fallback={<SectionLoader />}>
        <FeaturedProducts />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <BestSelling />
      </Suspense>
      <Features />
      <Suspense fallback={<SectionLoader height="h-64" />}>
        <ProductGallery />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <CustomerReviews />
      </Suspense>
      <Footer />
      <MobileBottomNav />
      <FloatingCart />
    </div>
  );
};

export default Index;
