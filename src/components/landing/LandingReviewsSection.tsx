import { Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Review {
  id: string;
  customer_name: string;
  review_text: string;
  display_order: number;
}

interface LandingReviewsSectionProps {
  reviews: Review[];
}

export function LandingReviewsSection({ reviews }: LandingReviewsSectionProps) {
  return (
    <section className="py-16 bg-[#1a1a2e]">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
          গ্রাহকদের মতামত
        </h2>

        <div className="max-w-4xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {reviews.map((review) => (
                <CarouselItem key={review.id} className="pl-2 md:pl-4 md:basis-1/2">
                  <div className="bg-[#252547] rounded-xl p-6 h-full border border-gray-700/50">
                    <Quote className="h-8 w-8 text-primary/50 mb-4" />
                    
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      "{review.review_text}"
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {review.customer_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{review.customer_name}</p>
                        <p className="text-sm text-gray-400">ভেরিফাইড বায়ার</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 bg-primary/20 border-0 hover:bg-primary/40" />
            <CarouselNext className="hidden md:flex -right-12 bg-primary/20 border-0 hover:bg-primary/40" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
