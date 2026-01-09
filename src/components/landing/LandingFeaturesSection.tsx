import { CheckCircle2 } from "lucide-react";

interface LandingFeaturesSectionProps {
  features: string[];
}

export function LandingFeaturesSection({ features }: LandingFeaturesSectionProps) {
  return (
    <section className="py-16 bg-[#16162a]">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
          কেন আমাদের প্রোডাক্ট বেছে নেবেন?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-3 bg-[#252547] rounded-lg p-4 border border-gray-700/50"
            >
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-gray-200">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
