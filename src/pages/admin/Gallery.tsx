import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { GalleryDialog } from "@/components/admin/GalleryDialog";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { IMAGE_SIZES } from "@/config/imageSizes";

const Gallery = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: images, isLoading } = useQuery({
    queryKey: ["gallery-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      toast.success("Gallery image deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete gallery image");
      console.error(error);
    },
  });

  const handleEdit = (image: any) => {
    setEditingImage(image);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this gallery image?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingImage(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gallery Management</h1>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Image
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {images?.map((image) => (
                <TableRow key={image.id}>
                  <TableCell>
                    <div className="h-16 w-16 overflow-hidden rounded">
                      <OptimizedImage
                        src={image.image_url}
                        alt={image.title || "Gallery image"}
                        {...IMAGE_SIZES.adminThumbnail}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{image.title || "-"}</TableCell>
                  <TableCell>{image.display_order}</TableCell>
                  <TableCell>
                    <Badge variant={image.is_active ? "default" : "secondary"}>
                      {image.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(image)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(image.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {images?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No gallery images found. Add your first image to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <GalleryDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          image={editingImage}
        />
      </div>
    </div>
  );
};

export default Gallery;
