import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { ImageUpload } from "./ImageUpload";

const bannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  image_url: z.string().url("Must be a valid URL"),
  link_url: z.string().url().optional().or(z.literal("")),
  button_text: z.string().optional(),
  display_order: z.string().min(0, "Order must be positive"),
  is_active: z.boolean(),
});

type BannerForm = z.infer<typeof bannerSchema>;

interface BannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: any;
}

export const BannerDialog = ({ open, onOpenChange, banner }: BannerDialogProps) => {
  const queryClient = useQueryClient();

  const form = useForm<BannerForm>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "",
      button_text: "",
      display_order: "0",
      is_active: true,
    },
  });

  useEffect(() => {
    if (banner) {
      form.reset({
        title: banner.title,
        subtitle: banner.subtitle || "",
        image_url: banner.image_url,
        link_url: banner.link_url || "",
        button_text: banner.button_text || "",
        display_order: banner.display_order.toString(),
        is_active: banner.is_active,
      });
    } else {
      form.reset({
        title: "",
        subtitle: "",
        image_url: "",
        link_url: "",
        button_text: "",
        display_order: "0",
        is_active: true,
      });
    }
  }, [banner, form]);

  const mutation = useMutation({
    mutationFn: async (data: BannerForm) => {
      const bannerData = {
        title: data.title,
        subtitle: data.subtitle || null,
        image_url: data.image_url,
        link_url: data.link_url || null,
        button_text: data.button_text || null,
        display_order: parseInt(data.display_order),
        is_active: data.is_active,
      };

      if (banner) {
        const { error } = await supabase
          .from("hero_banners")
          .update(bannerData)
          .eq("id", banner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hero_banners").insert([bannerData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["hero-banners"] });
      toast.success(banner ? "Banner updated" : "Banner created");
      onOpenChange(false);
      form.reset();
    },
  });

  const onSubmit = (data: BannerForm) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{banner ? "Edit Banner" : "Add Banner"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      folder="banners"
                      label="Upload banner image (recommended: 1920x600px)"
                      required
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    For best results, use images with 16:9 aspect ratio
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link URL (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="button_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Button Text (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Shop Now" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="display_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel>Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
