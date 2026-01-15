import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Trash2 } from "lucide-react";
import { showSuccess, showError, showConfirmation } from "@/lib/sweetalert";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

const Reviews = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  
  // Reviews management component

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: async () => {
      let query = supabase
        .from("reviews")
        .select("*, products(name, slug)")
        .order("created_at", { ascending: false });

      if (filter === "pending") {
        query = query.eq("is_approved", false);
      } else if (filter === "approved") {
        query = query.eq("is_approved", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      showSuccess("Updated!", "Review status updated successfully");
    },
    onError: () => {
      showError("Error", "Failed to update review");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      showSuccess("Deleted!", "Review deleted successfully");
    },
    onError: () => {
      showError("Error", "Failed to delete review");
    },
  });

  const toggleReviewSelection = (reviewId: string, checked: boolean) => {
    setSelectedReviews((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(reviewId);
      } else {
        next.delete(reviewId);
      }
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReviews(new Set(reviews?.map((review) => review.id) || []));
    } else {
      setSelectedReviews(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.size === 0) return;
    const confirmed = await showConfirmation(
      "Delete Reviews",
      `You are about to delete ${selectedReviews.size} reviews. This action cannot be undone.`,
      "Delete"
    );
    if (confirmed) {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .in("id", Array.from(selectedReviews));
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      setSelectedReviews(new Set());
      showSuccess("Deleted!", "Selected reviews deleted successfully");
    }
  };

  const handleApprove = (id: string) => {
    updateMutation.mutate({ id, is_approved: true });
  };

  const handleReject = (id: string) => {
    updateMutation.mutate({ id, is_approved: false });
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmation(
      "Delete Review",
      "Are you sure you want to delete this review? This action cannot be undone.",
      "Delete"
    );
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Reviews Management</h1>
          <Button
            variant="destructive"
            disabled={selectedReviews.size === 0}
            onClick={handleBulkDelete}
          >
            Bulk Delete
          </Button>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Reviews</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={reviews?.length > 0 && selectedReviews.size === reviews.length}
                    onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                    aria-label="Select all reviews"
                  />
                </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews?.length === 0 ? (
                  <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No reviews found
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews?.map((review) => (
                    <TableRow key={review.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedReviews.has(review.id)}
                        onCheckedChange={(checked) => toggleReviewSelection(review.id, Boolean(checked))}
                        aria-label={`Select review from ${review.customer_name}`}
                      />
                    </TableCell>
                      <TableCell className="font-medium">
                        {review.products?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{review.customer_name}</div>
                          {review.customer_email && (
                            <div className="text-xs text-muted-foreground">
                              {review.customer_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="line-clamp-2 text-sm">
                          {review.review_text || <span className="text-muted-foreground">No review text</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={review.is_approved ? "default" : "secondary"}>
                          {review.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!review.is_approved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(review.id)}
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {review.is_approved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(review.id)}
                              title="Unapprove"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(review.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
