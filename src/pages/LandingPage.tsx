import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LandingHeroSection } from "@/components/landing/LandingHeroSection";
import { LandingProductsSection } from "@/components/landing/LandingProductsSection";
import { LandingReviewsSection } from "@/components/landing/LandingReviewsSection";
import { LandingOrderForm } from "@/components/landing/LandingOrderForm";
import { LandingFeaturesSection } from "@/components/landing/LandingFeaturesSection";
import { Skeleton } from "@/components/ui/skeleton";

interface LandingPageProduct {
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

interface LandingPageReview {
  id: string;
  customer_name: string;
  review_text: string;
  display_order: number;
}

const LandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const orderFormRef = useRef<HTMLDivElement>(null);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  const { data: landingPage, isLoading: isPageLoading } = useQuery({
    queryKey: ["landing-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: products } = useQuery({
    queryKey: ["landing-page-products", landingPage?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_products")
        .select(`
          *,
          products (
            id,
            name,
            price,
            original_price,
            image_url,
            slug
          )
        `)
        .eq("landing_page_id", landingPage!.id)
        .order("display_order");
      if (error) throw error;
      return data as LandingPageProduct[];
    },
    enabled: !!landingPage?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["landing-page-reviews", landingPage?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_reviews")
        .select("*")
        .eq("landing_page_id", landingPage!.id)
        .order("display_order");
      if (error) throw error;
      return data as LandingPageReview[];
    },
    enabled: !!landingPage?.id,
  });

  // Initialize quantities
  useEffect(() => {
    if (products && Object.keys(selectedQuantities).length === 0) {
      const initial: Record<string, number> = {};
      products.forEach((p, index) => {
        initial[p.id] = index === 0 ? 1 : 0;
      });
      setSelectedQuantities(initial);
    }
  }, [products]);

  // Set up Meta Pixel
  useEffect(() => {
    if (landingPage?.fb_pixel_id) {
      // Inject Meta Pixel script
      const script = document.createElement("script");
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${landingPage.fb_pixel_id}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);

      // Cleanup
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [landingPage?.fb_pixel_id]);

  // Update page meta and SEO
  useEffect(() => {
    if (landingPage) {
      document.title = landingPage.meta_title || landingPage.title;
      
      // Helper to update or create meta tags
      const updateOrCreateMeta = (name: string, content: string, isProperty = false) => {
        const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
        let meta = document.querySelector(selector);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute(isProperty ? 'property' : 'name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
      };

      // Update description
      if (landingPage.meta_description) {
        updateOrCreateMeta('description', landingPage.meta_description);
      }

      // Update keywords
      if (landingPage.meta_keywords) {
        updateOrCreateMeta('keywords', landingPage.meta_keywords);
      }

      // Open Graph tags for social sharing
      updateOrCreateMeta('og:title', landingPage.meta_title || landingPage.title, true);
      if (landingPage.meta_description) {
        updateOrCreateMeta('og:description', landingPage.meta_description, true);
      }
      if (landingPage.hero_image_url) {
        updateOrCreateMeta('og:image', landingPage.hero_image_url, true);
      }
      updateOrCreateMeta('og:type', 'product', true);
      updateOrCreateMeta('og:url', window.location.href, true);

      // Cleanup on unmount
      return () => {
        // Remove dynamically added OG tags
        ['og:title', 'og:description', 'og:image', 'og:type', 'og:url'].forEach(prop => {
          const meta = document.querySelector(`meta[property="${prop}"]`);
          if (meta) meta.remove();
        });
      };
    }
  }, [landingPage]);

  const scrollToOrderForm = () => {
    orderFormRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, quantity),
    }));
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-[60vh] w-full" />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">This landing page doesn't exist or is not active.</p>
        </div>
      </div>
    );
  }

  const features = Array.isArray(landingPage.features) ? landingPage.features as string[] : [];

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Hero Section */}
      <LandingHeroSection
        imageUrl={landingPage.hero_image_url}
        title={landingPage.hero_title}
        subtitle={landingPage.hero_subtitle}
        ctaText={landingPage.hero_cta_text}
        statsText={landingPage.hero_stats_text}
        onCtaClick={scrollToOrderForm}
      />

      {/* Products Section */}
      {products && products.length > 0 && (
        <LandingProductsSection
          products={products}
          quantities={selectedQuantities}
          onQuantityChange={updateQuantity}
        />
      )}

      {/* Features Section */}
      {features.length > 0 && (
        <LandingFeaturesSection features={features} />
      )}

      {/* Reviews Section */}
      {reviews && reviews.length > 0 && (
        <LandingReviewsSection reviews={reviews} />
      )}

      {/* Order Form Section */}
      <div ref={orderFormRef}>
        <LandingOrderForm
          landingPage={landingPage}
          products={products || []}
          quantities={selectedQuantities}
          onQuantityChange={updateQuantity}
        />
      </div>

      {/* Footer */}
      <footer className="bg-[#16162a] py-6 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default LandingPage;
