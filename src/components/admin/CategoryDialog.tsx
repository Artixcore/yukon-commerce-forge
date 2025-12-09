import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/lib/sweetalert";
import { getCategoriesForSelect, getDescendantIds, wouldCreateCircularReference } from "@/lib/categoryUtils";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/admin/ImageUpload";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  parent_id: z.string().nullable().optional(),
  image_url: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

export const CategoryDialog = ({ open, onOpenChange, category }: any) => {
  const queryClient = useQueryClient();
  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { 
      name: "", slug: "", description: "", parent_id: null, image_url: "",
      meta_title: "", meta_description: "", meta_keywords: ""
    },
  });

  // Fetch all categories for parent selection
  const { data: allCategories } = useQuery({
    queryKey: ["all-categories-for-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        parent_id: category.parent_id || null,
        image_url: category.image_url || "",
        meta_title: category.meta_title || "",
        meta_description: category.meta_description || "",
        meta_keywords: category.meta_keywords || "",
      });
    } else {
      form.reset({ 
        name: "", slug: "", description: "", parent_id: null, image_url: "",
        meta_title: "", meta_description: "", meta_keywords: ""
      });
    }
  }, [category, form]);

  const mutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      // Validate circular reference
      if (category && data.parent_id && allCategories) {
        if (wouldCreateCircularReference(category.id, data.parent_id, allCategories)) {
          throw new Error("Cannot create circular reference: this category or its descendants cannot become its own parent");
        }
      }

      const categoryData = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        parent_id: data.parent_id || null,
        image_url: data.image_url || null,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        meta_keywords: data.meta_keywords || null,
      };
      
      if (category) {
        const { error } = await supabase.from("categories").update(categoryData).eq("id", category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert([categoryData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["all-categories-for-select"] });
      showSuccess(
        category ? "Updated!" : "Created!",
        category ? "Category updated successfully" : "Category created successfully"
      );
      onOpenChange(false);
    },
    onError: (error: Error) => {
      showError("Error", error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input {...field} placeholder="e.g., Electronics, Mobile Phones" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <FormField control={form.control} name="slug" render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl><Input {...field} placeholder="e.g., electronics, mobile-phones" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="image_url" render={({ field }) => (
              <FormItem>
                <FormLabel>Category Image (Optional)</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    folder="categories"
                    label="Upload category icon or banner (recommended: 400x400px)"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Add a custom icon or banner image for this category
                </p>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="parent_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Category</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === "root" ? null : value)} 
                  value={field.value || "root"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="root">
                      <span className="flex items-center gap-2">
                        📁 Root Category
                        <Badge variant="secondary" className="text-xs">Level 0</Badge>
                      </span>
                    </SelectItem>
                    {allCategories && getCategoriesForSelect(
                      allCategories,
                      category ? [category.id, ...getDescendantIds(category.id, allCategories)] : []
                    ).map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          {cat.label}
                          <Badge variant="outline" className="text-xs">Level {cat.level}</Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave as "Root Category" for top-level categories. Max depth: 3 levels.
                </p>
                <FormMessage />
              </FormItem>
            )} />
            
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl><Textarea {...field} rows={3} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold">SEO Settings (Optional)</h3>
              
              <FormField control={form.control} name="meta_title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Title</FormLabel>
                  <FormControl><Input {...field} placeholder="Defaults to category name" /></FormControl>
                  <p className="text-xs text-muted-foreground">Custom title for search engines</p>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="meta_description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Description</FormLabel>
                  <FormControl><Textarea {...field} rows={2} placeholder="Brief description for search results" /></FormControl>
                  <p className="text-xs text-muted-foreground">Max 160 characters recommended</p>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="meta_keywords" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Keywords</FormLabel>
                  <FormControl><Input {...field} placeholder="keyword1, keyword2, keyword3" /></FormControl>
                  <p className="text-xs text-muted-foreground">Comma-separated keywords</p>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
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
