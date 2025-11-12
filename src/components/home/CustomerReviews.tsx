import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { useIsMobile } from "@/hooks/use-mobile";

interface Review {
  id: number;
  name: string;
  location: string;
  rating: number;
  review: string;
  date: string;
}

const reviews: Review[] = [
  {
    id: 1,
    name: "নাজমুল হোসেন",
    location: "ঢাকা",
    rating: 5,
    review: "প্রোডাক্টের কোয়ালিটি অসাধারণ! ডেলিভারি খুবই দ্রুত হয়েছে। দাম অনুযায়ী পণ্যের মান খুবই ভালো। আবারও কিনবো ইনশাআল্লাহ।",
    date: "২ সপ্তাহ আগে"
  },
  {
    id: 2,
    name: "ফারহানা আক্তার",
    location: "চট্টগ্রাম",
    rating: 5,
    review: "অনেক সুন্দর পণ্য পেয়েছি। প্যাকেজিং দারুণ ছিল। কাস্টমার সার্ভিস খুবই ভালো। সবাইকে রেকমেন্ড করবো।",
    date: "১ মাস আগে"
  },
  {
    id: 3,
    name: "রাকিবুল ইসলাম",
    location: "সিলেট",
    rating: 4,
    review: "ভালো মানের প্রোডাক্ট। দাম একটু বেশি মনে হলেও কোয়ালিটি দেখে সন্তুষ্ট। ডেলিভারি সময়মতো হয়েছে।",
    date: "৩ সপ্তাহ আগে"
  },
  {
    id: 4,
    name: "সাদিয়া হক",
    location: "খুলনা",
    rating: 5,
    review: "চমৎকার অভিজ্ঞতা! পণ্য হাতে পেয়ে খুবই খুশি হয়েছি। ছবির মতোই পণ্য পেয়েছি। ধন্যবাদ Yukon Lifestyle কে।",
    date: "১ সপ্তাহ আগে"
  },
  {
    id: 5,
    name: "তানভীর আহমেদ",
    location: "রাজশাহী",
    rating: 5,
    review: "অসাধারণ সার্ভিস এবং প্রোডাক্ট কোয়ালিটি। দাম খুবই যুক্তিসংগত। রেগুলার কাস্টমার হয়ে গেলাম।",
    date: "৪ দিন আগে"
  }
];

export const CustomerReviews = () => {
  const isMobile = useIsMobile();
  
  const getInitials = (name: string) => {
    // Get first character of the Bengali name
    return name.charAt(0);
  };

  const carouselPlugins = isMobile ? [] : [Autoplay({ delay: 4000 })];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">গ্রাহক পর্যালোচনা</h2>
          <p className="text-muted-foreground">Customer Reviews</p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={carouselPlugins}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {reviews.map((review) => (
              <CarouselItem key={review.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {getInitials(review.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{review.name}</h3>
                        <p className="text-sm text-muted-foreground">{review.location}</p>
                      </div>
                    </div>

                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-muted text-muted"
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-sm leading-relaxed mb-4 flex-1" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                      {review.review}
                    </p>

                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
};
