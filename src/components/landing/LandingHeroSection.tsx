import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface LandingHeroSectionProps {
  imageUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string | null;
  statsText?: string | null;
  onCtaClick: () => void;
}

export function LandingHeroSection({
  imageUrl,
  title,
  subtitle,
  ctaText,
  statsText,
  onCtaClick,
}: LandingHeroSectionProps) {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center">
      {/* Background Image */}
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#1a1a2e]" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Stats Badge */}
        {statsText && (
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-2 mb-6 animate-pulse">
            <span className="text-primary">🔥</span>
            <span className="text-sm font-medium">{statsText}</span>
          </div>
        )}

        {/* Title */}
        {title && (
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {title}
          </h1>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}

        {/* CTA Button */}
        <Button
          size="lg"
          onClick={onCtaClick}
          className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6 rounded-full shadow-lg shadow-primary/30 animate-bounce"
        >
          {ctaText || "অর্ডার করুন"}
          <ChevronDown className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-8 w-8 text-white/50" />
      </div>
    </section>
  );
}
