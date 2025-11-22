import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, FolderOpen, Folder, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CategoryDialog } from "@/components/admin/CategoryDialog";
import { showSuccess, showConfirmation } from "@/lib/sweetalert";
import { buildCategoryTree, CategoryTree } from "@/lib/categoryUtils";

const Categories = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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

  const handleDelete = async (category: any) => {
    const hasChildren = categories?.some(c => c.parent_id === category.id);
    
    const confirmed = await showConfirmation(
      'Delete Category?',
      hasChildren 
        ? 'This category has subcategories. Deleting it will also delete all its subcategories. This action cannot be undone.'
        : 'This action cannot be undone. The category will be permanently deleted.',
      'Yes, delete it!'
    );
    
    if (confirmed) {
      deleteMutation.mutate(category.id);
    }
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryRow = (category: CategoryTree, level: number = 0) => {
    const hasChildren = category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const indent = level * 24; // 24px per level

    return (
      <>
        <TableRow key={category.id}>
          <TableCell className="font-medium">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${indent}px` }}>
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleExpand(category.id)}
                >
                  <ChevronRight 
                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                  />
                </Button>
              ) : (
                <div className="w-6" />
              )}
              
              {level === 0 ? (
                <FolderOpen className="h-4 w-4 text-primary" />
              ) : (
                <Folder className="h-4 w-4 text-muted-foreground" />
              )}
              
              <span>{category.name}</span>
              
              <Badge variant={level === 0 ? "default" : "secondary"} className="text-xs">
                Level {category.level}
              </Badge>
              
              {hasChildren && (
                <Badge variant="outline" className="text-xs">
                  {category.children.length} {category.children.length === 1 ? 'subcategory' : 'subcategories'}
                </Badge>
              )}
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground">{category.slug}</TableCell>
          <TableCell className="hidden md:table-cell text-muted-foreground">
            {category.description || '—'}
          </TableCell>
          <TableCell className="text-right space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { 
                setSelectedCategory(category); 
                setIsDialogOpen(true); 
              }}
            >
              <Pencil className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleDelete(category)}
            >
              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </TableCell>
        </TableRow>
        
        {hasChildren && isExpanded && category.children.map(child => 
          renderCategoryRow(child, level + 1)
        )}
      </>
    );
  };

  const categoryTree = categories ? buildCategoryTree(categories) : [];

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage product categories and subcategories (max 3 levels)
          </p>
        </div>
        <Button onClick={() => { setSelectedCategory(null); setIsDialogOpen(true); }}>
          <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="text-sm md:text-base">Add Category</span>
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : categoryTree.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first category
          </p>
          <Button onClick={() => { setSelectedCategory(null); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryTree.map(category => renderCategoryRow(category, 0))}
            </TableBody>
          </Table>
        </div>
      )}

      <CategoryDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} category={selectedCategory} />
    </div>
  );
};

export default Categories;
