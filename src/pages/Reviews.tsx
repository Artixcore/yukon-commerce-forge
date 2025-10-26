import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

const Reviews = () => {
  // Mock reviews data - in real app, this would come from database
  const reviews = [
    {
      id: 1,
      name: "Rahul Ahmed",
      rating: 5,
      date: "2024-03-15",
      comment: "Excellent service and fast delivery! The product quality exceeded my expectations.",
    },
    {
      id: 2,
      name: "Fatima Khan",
      rating: 5,
      date: "2024-03-14",
      comment: "Very satisfied with my purchase. Customer support was very helpful.",
    },
    {
      id: 3,
      name: "Asif Rahman",
      rating: 4,
      date: "2024-03-12",
      comment: "Good products at reasonable prices. Delivery was on time.",
    },
    {
      id: 4,
      name: "Nusrat Jahan",
      rating: 5,
      date: "2024-03-10",
      comment: "Amazing shopping experience! Will definitely order again.",
    },
    {
      id: 5,
      name: "Karim Hossain",
      rating: 4,
      date: "2024-03-08",
      comment: "Quality products and professional service. Highly recommended!",
    },
    {
      id: 6,
      name: "Ayesha Begum",
      rating: 5,
      date: "2024-03-05",
      comment: "Best online shopping experience in Bangladesh. Fast and reliable!",
    },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${
              index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const averageRating = (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Customer Reviews</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            See what our customers are saying about us
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
              <span className="text-3xl font-bold">{averageRating}</span>
            </div>
            <div className="text-muted-foreground">
              Based on {reviews.length} reviews
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{review.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(review.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {renderStars(review.rating)}
              </div>
              <p className="text-muted-foreground">{review.comment}</p>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Card className="p-8 max-w-2xl mx-auto bg-primary/5">
            <h2 className="text-2xl font-bold mb-4">Share Your Experience</h2>
            <p className="text-muted-foreground mb-6">
              Have you shopped with us? We'd love to hear about your experience!
            </p>
            <a 
              href="/contact" 
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium"
            >
              Leave a Review
            </a>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Reviews;
