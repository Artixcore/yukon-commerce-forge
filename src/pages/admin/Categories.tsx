import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryDialog } from "@/components/admin/CategoryDialog";
import { showSuccess, showConfirmation } from "@/lib/sweetalert";

const Categories = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      showSuccess("Deleted!", "Category deleted successfully");
    },
  });

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmation(
      'Delete Category?',
      'This action cannot be undone. The category will be permanently deleted.',
      'Yes, delete it!'
    );
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold">Categories</h1>
        <Button onClick={() => { setSelectedCategory(null); setIsDialogOpen(true); }}>
          <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="text-sm md:text-base">Add Category</span>
        </Button>
      </div>

      {isLoading ? <div>Loading...</div> : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>{cat.slug}</TableCell>
                  <TableCell className="hidden md:table-cell">{cat.description}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedCategory(cat); setIsDialogOpen(true); }}>
                      <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CategoryDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} category={selectedCategory} />
    </div>
  );
};

export default Categories;
