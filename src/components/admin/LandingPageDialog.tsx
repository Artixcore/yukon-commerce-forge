import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ProductSelector } from "@/components/admin/ProductSelector";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { showSuccess, showError } from "@/lib/sweetalert";
import { ScrollArea } from "@/components/ui/scroll-area";

const landingPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .refine((val) => !val.startsWith("-") && !val.endsWith("-"), {
      message: "Slug cannot start or end with a hyphen",
    }),
  hero_image_url: z.string().optional(),
  hero_title: z.string().optional(),
  hero_subtitle: z.string().optional(),
  hero_cta_text: z.string().optional(),
  hero_stats_text: z.string().optional(),
  // SEO Settings - will be saved with tag lp-{slug}
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  // Facebook/Meta Pixel Settings - will be saved with tag lp-{slug}
  fb_pixel_id: z.string().optional(),
  fb_access_token: z.string().optional(),
  fb_test_event_code: z.string().optional(),
  fb_dataset_id: z.string().optional(),
  delivery_charge_inside: z.coerce.number().min(0).default(60),
  delivery_charge_outside: z.coerce.number().min(0).default(120),
  is_active: z.boolean().default(true),
});

type LandingPageFormData = z.infer<typeof landingPageSchema>;

interface LandingPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landingPage?: any;
}

interface SelectedProduct {
  product_id: string | null;
  custom_name?: string;
  custom_price?: number;
  custom_original_price?: number;
  custom_image_url?: string;
  display_order: number;
}

interface Review {
  id?: string;
  customer_name: string;
  review_text: string;
  display_order: number;
}

export function LandingPageDialog({ open, onOpenChange, landingPage }: LandingPageDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<LandingPageFormData>({
    resolver: zodResolver(landingPageSchema),
    defaultValues: {
      title: "",
      slug: "",
      hero_cta_text: "অর্ডার করুন",
      delivery_charge_inside: 60,
      delivery_charge_outside: 120,
      is_active: true,
    },
  });

  const title = watch("title");

  // Auto-generate slug from title
  useEffect(() => {
    if (!landingPage && title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setValue("slug", slug);
    }
  }, [title, landingPage, setValue]);

  // Fetch existing products and reviews when editing
  const { data: existingProducts } = useQuery({
    queryKey: ["landing-page-products", landingPage?.id],
    queryFn: async () => {
      if (!landingPage?.id) return [];
      const { data, error } = await supabase
        .from("landing_page_products")
        .select("*")
        .eq("landing_page_id", landingPage.id)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!landingPage?.id,
  });

  const { data: existingReviews } = useQuery({
    queryKey: ["landing-page-reviews", landingPage?.id],
    queryFn: async () => {
      if (!landingPage?.id) return [];
      const { data, error } = await supabase
        .from("landing_page_reviews")
        .select("*")
        .eq("landing_page_id", landingPage.id)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!landingPage?.id,
  });

  useEffect(() => {
    if (landingPage) {
      reset({
        title: landingPage.title,
        slug: landingPage.slug,
        hero_image_url: landingPage.hero_image_url || "",
        hero_title: landingPage.hero_title || "",
        hero_subtitle: landingPage.hero_subtitle || "",
        hero_cta_text: landingPage.hero_cta_text || "অর্ডার করুন",
        hero_stats_text: landingPage.hero_stats_text || "",
        meta_title: landingPage.meta_title || "",
        meta_description: landingPage.meta_description || "",
        meta_keywords: landingPage.meta_keywords || "",
        fb_pixel_id: landingPage.fb_pixel_id || "",
        fb_access_token: landingPage.fb_access_token || "",
        fb_test_event_code: landingPage.fb_test_event_code || "",
        fb_dataset_id: landingPage.fb_dataset_id || "",
        delivery_charge_inside: landingPage.delivery_charge_inside || 60,
        delivery_charge_outside: landingPage.delivery_charge_outside || 120,
        is_active: landingPage.is_active ?? true,
      });
      setFeatures(Array.isArray(landingPage.features) ? landingPage.features : []);
    } else {
      reset({
        title: "",
        slug: "",
        hero_cta_text: "অর্ডার করুন",
        delivery_charge_inside: 60,
        delivery_charge_outside: 120,
        is_active: true,
      });
      setFeatures([]);
      setSelectedProducts([]);
      setReviews([]);
    }
  }, [landingPage, reset]);

  useEffect(() => {
    if (existingProducts) {
      setSelectedProducts(existingProducts.map(p => ({
        product_id: p.product_id,
        custom_name: p.custom_name || undefined,
        custom_price: p.custom_price || undefined,
        custom_original_price: p.custom_original_price || undefined,
        custom_image_url: p.custom_image_url || undefined,
        display_order: p.display_order,
      })));
    }
  }, [existingProducts]);

  useEffect(() => {
    if (existingReviews) {
      setReviews(existingReviews.map(r => ({
        id: r.id,
        customer_name: r.customer_name,
        review_text: r.review_text,
        display_order: r.display_order,
      })));
    }
  }, [existingReviews]);

  const mutation = useMutation({
    mutationFn: async (data: LandingPageFormData) => {
      // Validate slug is present before saving SEO/FB settings
      if (!data.slug || data.slug.trim() === "") {
        throw new Error("Slug is required. SEO and Facebook Pixel settings must be associated with a valid landing page slug.");
      }

      // Normalize slug (remove leading/trailing spaces and ensure lowercase)
      const normalizedSlug = data.slug.trim().toLowerCase();

      // Prepare SEO settings - convert empty strings to null
      const seoSettings = {
        meta_title: data.meta_title?.trim() || null,
        meta_description: data.meta_description?.trim() || null,
        meta_keywords: data.meta_keywords?.trim() || null,
      };

      // Prepare Facebook/Meta Pixel settings - convert empty strings to null
      const fbPixelSettings = {
        fb_pixel_id: data.fb_pixel_id?.trim() || null,
        fb_access_token: data.fb_access_token?.trim() || null,
        fb_test_event_code: data.fb_test_event_code?.trim() || null,
        fb_dataset_id: data.fb_dataset_id?.trim() || null,
      };

      const landingPageData = {
        title: data.title,
        slug: normalizedSlug,
        hero_image_url: data.hero_image_url || null,
        hero_title: data.hero_title || null,
        hero_subtitle: data.hero_subtitle || null,
        hero_cta_text: data.hero_cta_text || "অর্ডার করুন",
        hero_stats_text: data.hero_stats_text || null,
        // SEO Settings - saved with slug tag (lp-{slug})
        ...seoSettings,
        // Facebook/Meta Pixel Settings - saved with slug tag (lp-{slug})
        ...fbPixelSettings,
        features: features,
        delivery_charge_inside: data.delivery_charge_inside,
        delivery_charge_outside: data.delivery_charge_outside,
        is_active: data.is_active,
      };

      let pageId: string;
      const slugTag = `lp-${normalizedSlug}`;

      try {
        if (landingPage) {
          const { error } = await supabase
            .from("landing_pages")
            .update(landingPageData)
            .eq("id", landingPage.id);
          if (error) {
            throw new Error(`Failed to update landing page settings for slug "${normalizedSlug}" (tag: ${slugTag}): ${error.message}`);
          }
          pageId = landingPage.id;
        } else {
          const { data: newPage, error } = await supabase
            .from("landing_pages")
            .insert(landingPageData)
            .select()
            .single();
          if (error) {
            throw new Error(`Failed to create landing page with slug "${normalizedSlug}" (tag: ${slugTag}): ${error.message}`);
          }
          pageId = newPage.id;
        }
      } catch (error: any) {
        // Re-throw with slug context for better debugging
        const errorMessage = error.message || "Unknown error occurred";
        throw new Error(`Error saving settings for landing page slug "${normalizedSlug}" (tag: ${slugTag}): ${errorMessage}`);
      }

      // Update products
      await supabase.from("landing_page_products").delete().eq("landing_page_id", pageId);
      if (selectedProducts.length > 0) {
        const productsData = selectedProducts.map((p, idx) => ({
          landing_page_id: pageId,
          product_id: p.product_id,
          custom_name: p.custom_name || null,
          custom_price: p.custom_price || null,
          custom_original_price: p.custom_original_price || null,
          custom_image_url: p.custom_image_url || null,
          display_order: idx,
        }));
        const { error: productsError } = await supabase.from("landing_page_products").insert(productsData);
        if (productsError) throw productsError;
      }

      // Update reviews
      await supabase.from("landing_page_reviews").delete().eq("landing_page_id", pageId);
      if (reviews.length > 0) {
        const reviewsData = reviews.map((r, idx) => ({
          landing_page_id: pageId,
          customer_name: r.customer_name,
          review_text: r.review_text,
          display_order: idx,
        }));
        const { error: reviewsError } = await supabase.from("landing_page_reviews").insert(reviewsData);
        if (reviewsError) throw reviewsError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-landing-pages"] });
      const slugTag = `lp-${variables.slug}`;
      showSuccess(
        "Success!", 
        landingPage 
          ? `Landing page updated successfully. SEO and Facebook Pixel settings saved with tag: ${slugTag}`
          : `Landing page created successfully. SEO and Facebook Pixel settings saved with tag: ${slugTag}`
      );
      onOpenChange(false);
    },
    onError: (error: any) => {
      showError("Save Failed", error.message || "Failed to save landing page settings");
    },
  });

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const addReview = () => {
    setReviews([...reviews, { customer_name: "", review_text: "", display_order: reviews.length }]);
  };

  const updateReview = (index: number, field: keyof Review, value: string) => {
    const updated = [...reviews];
    updated[index] = { ...updated[index], [field]: value };
    setReviews(updated);
  };

  const removeReview = (index: number) => {
    setReviews(reviews.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {landingPage ? "Edit Landing Page" : "Create New Landing Page"}
          </DialogTitle>
          <DialogDescription>
            {landingPage ? "Update your landing page settings and content" : "Create a new landing page with products, reviews, and order form"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6">
              <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="hero">Hero</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="meta">Meta/FB</TabsTrigger>
                <TabsTrigger value="delivery">Delivery</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[60vh] px-6 py-4">
              <TabsContent value="basic" className="mt-0 space-y-4">
                <div>
                  <Label htmlFor="title">Page Title *</Label>
                  <Input id="title" {...register("title")} placeholder="Enter page title" />
                  {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">/lp/</span>
                    <Input id="slug" {...register("slug")} placeholder="page-slug" />
                  </div>
                  {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={watch("is_active")}
                    onCheckedChange={(checked) => setValue("is_active", checked)}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </TabsContent>

              <TabsContent value="hero" className="mt-0 space-y-4">
                <div>
                  <Label>Hero Image</Label>
                  <ImageUpload
                    value={watch("hero_image_url") || ""}
                    onChange={(url) => setValue("hero_image_url", url)}
                    folder="landing-pages"
                  />
                </div>

                <div>
                  <Label htmlFor="hero_title">Hero Title</Label>
                  <Input id="hero_title" {...register("hero_title")} placeholder="Main headline" />
                </div>

                <div>
                  <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                  <Textarea id="hero_subtitle" {...register("hero_subtitle")} placeholder="Supporting text" rows={3} />
                </div>

                <div>
                  <Label htmlFor="hero_cta_text">CTA Button Text</Label>
                  <Input id="hero_cta_text" {...register("hero_cta_text")} placeholder="অর্ডার করুন" />
                </div>

                <div>
                  <Label htmlFor="hero_stats_text">Stats Badge (optional)</Label>
                  <Input id="hero_stats_text" {...register("hero_stats_text")} placeholder="e.g., 27000+ Happy Customers" />
                </div>
              </TabsContent>

              <TabsContent value="products" className="mt-0 space-y-4">
                <ProductSelector
                  selectedProducts={selectedProducts}
                  onProductsChange={setSelectedProducts}
                />
              </TabsContent>

              <TabsContent value="features" className="mt-0 space-y-4">
                <div>
                  <Label>Features List</Label>
                  <p className="text-sm text-muted-foreground mb-2">Add key selling points for your product</p>
                  
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Enter a feature"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{feature}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-0 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label>Customer Reviews</Label>
                    <p className="text-sm text-muted-foreground">Add testimonials to build trust</p>
                  </div>
                  <Button type="button" onClick={addReview} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Review
                  </Button>
                </div>

                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <Label>Review #{index + 1}</Label>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeReview(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={review.customer_name}
                        onChange={(e) => updateReview(index, "customer_name", e.target.value)}
                        placeholder="Customer name"
                      />
                      <Textarea
                        value={review.review_text}
                        onChange={(e) => updateReview(index, "review_text", e.target.value)}
                        placeholder="Review text"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="meta" className="mt-0 space-y-4">
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold">SEO Settings</h3>
                  <div>
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input id="meta_title" {...register("meta_title")} placeholder="Page title for search engines" />
                  </div>
                  <div>
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea id="meta_description" {...register("meta_description")} placeholder="Page description for search engines" rows={2} />
                  </div>
                  <div>
                    <Label htmlFor="meta_keywords">Meta Keywords</Label>
                    <Input id="meta_keywords" {...register("meta_keywords")} placeholder="keyword1, keyword2, keyword3" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Facebook/Meta Pixel Settings</h3>
                  <p className="text-sm text-muted-foreground">These settings are specific to this landing page and override the global settings</p>
                  
                  <div>
                    <Label htmlFor="fb_pixel_id">Facebook Pixel ID</Label>
                    <Input id="fb_pixel_id" {...register("fb_pixel_id")} placeholder="123456789012345" />
                  </div>
                  <div>
                    <Label htmlFor="fb_access_token">Conversion API Access Token</Label>
                    <Input id="fb_access_token" {...register("fb_access_token")} type="password" placeholder="EAAxxxxxxx..." />
                  </div>
                  <div>
                    <Label htmlFor="fb_test_event_code">Test Event Code (optional)</Label>
                    <Input id="fb_test_event_code" {...register("fb_test_event_code")} placeholder="TEST12345" />
                  </div>
                  <div>
                    <Label htmlFor="fb_dataset_id">Dataset ID (optional)</Label>
                    <Input id="fb_dataset_id" {...register("fb_dataset_id")} placeholder="Dataset ID for aggregated event measurement" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="delivery" className="mt-0 space-y-4">
                <div>
                  <Label htmlFor="delivery_charge_inside">Delivery Charge (Inside Dhaka)</Label>
                  <div className="flex items-center gap-2">
                    <span>৳</span>
                    <Input
                      id="delivery_charge_inside"
                      type="number"
                      {...register("delivery_charge_inside")}
                      className="w-32"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="delivery_charge_outside">Delivery Charge (Outside Dhaka)</Label>
                  <div className="flex items-center gap-2">
                    <span>৳</span>
                    <Input
                      id="delivery_charge_outside"
                      type="number"
                      {...register("delivery_charge_outside")}
                      className="w-32"
                    />
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>

            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : landingPage ? "Update Page" : "Create Page"}
              </Button>
            </div>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}
