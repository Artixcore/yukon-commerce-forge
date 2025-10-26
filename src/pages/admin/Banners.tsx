import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BannerDialog } from "@/components/admin/BannerDialog";
import { showSuccess, showConfirmation } from "@/lib/sweetalert";
import { Pencil, Trash2, Plus } from "lucide-react";

const Banners = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_banners")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hero_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      showSuccess("Deleted!", "Banner deleted successfully");
    },
  });

  const handleEdit = (banner: any) => {
    setSelectedBanner(banner);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmation(
      'Delete Banner?',
      'This banner will be removed from the homepage.',
      'Yes, delete it!'
    );
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Hero Banners</h1>
        <Button onClick={() => {
          setSelectedBanner(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="text-sm md:text-base">Add Banner</span>
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Linked To</TableHead>
                <TableHead className="hidden lg:table-cell">Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners?.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <img 
                      src={banner.image_url} 
                      alt={banner.title}
                      className="w-16 h-10 md:w-20 md:h-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell>{banner.title}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {banner.link_url ? (
                      banner.link_url.startsWith('/product/') ? (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Product: {banner.link_url.replace('/product/', '')}
                        </span>
                      ) : (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          External Link
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">No link</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{banner.display_order}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(banner)}
                      >
                        <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(banner.id)}
                      >
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <BannerDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        banner={selectedBanner}
      />
    </div>
  );
};

export default Banners;
