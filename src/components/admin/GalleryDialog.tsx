import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "./ImageUpload";

interface GalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image?: any;
}

export function GalleryDialog({ open, onOpenChange, image }: GalleryDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      title: "",
      image_url: "",
      display_order: 0,
      is_active: true,
    },
  });

  const imageUrl = watch("image_url");

  useEffect(() => {
    if (image) {
      reset({
        title: image.title || "",
        image_url: image.image_url || "",
        display_order: image.display_order || 0,
        is_active: image.is_active ?? true,
      });
    } else {
      reset({
        title: "",
        image_url: "",
        display_order: 0,
        is_active: true,
      });
    }
  }, [image, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (image) {
        const { error } = await supabase
          .from("gallery_images")
          .update(data)
          .eq("id", image.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("gallery_images")
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      toast.success(image ? "Image updated successfully" : "Image added successfully");
      onOpenChange(false);
      reset();
    },
    onError: (error) => {
      toast.error("Failed to save gallery image");
      console.error(error);
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{image ? "Edit Gallery Image" : "Add Gallery Image"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter image title"
            />
          </div>

          <div>
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              {...register("image_url")}
              placeholder="Enter image URL"
              required
            />
            <ImageUpload
              value={imageUrl}
              onChange={(url) => setValue("image_url", url)}
              folder="products"
            />
          </div>

          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              {...register("display_order", { valueAsNumber: true })}
              placeholder="0"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
