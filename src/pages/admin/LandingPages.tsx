import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Eye, Copy, ExternalLink } from "lucide-react";
import { LandingPageDialog } from "@/components/admin/LandingPageDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showSuccess, showConfirmation, showInfo } from "@/lib/sweetalert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const LandingPages = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: landingPages, isLoading } = useQuery({
    queryKey: ["admin-landing-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages")
        .select(`
          *,
          landing_page_orders(count)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("landing_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-landing-pages"] });
      showSuccess("Deleted!", "Landing page has been deleted successfully");
    },
  });

  const togglePageSelection = (pageId: string, checked: boolean) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(pageId);
      } else {
        next.delete(pageId);
      }
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPages(new Set(landingPages?.map((page) => page.id) || []));
    } else {
      setSelectedPages(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPages.size === 0) return;
    const confirmed = await showConfirmation(
      "Delete Landing Pages?",
      `You are about to delete ${selectedPages.size} landing pages. This action cannot be undone.`,
      "Yes, delete them!"
    );
    if (confirmed) {
      const { error } = await supabase
        .from("landing_pages")
        .delete()
        .in("id", Array.from(selectedPages));
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-landing-pages"] });
      setSelectedPages(new Set());
      showSuccess("Deleted!", "Selected landing pages deleted successfully");
    }
  };

  const handleEdit = (page: any) => {
    setSelectedPage(page);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmation(
      'Delete Landing Page?',
      'This will also delete all associated products, reviews, and orders. This action cannot be undone.',
      'Yes, delete it!'
    );
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/lp/${slug}`;
    await navigator.clipboard.writeText(url);
    showInfo("Copied!", "Landing page URL copied to clipboard");
  };

  const openPreview = (slug: string) => {
    window.open(`/lp/${slug}`, '_blank');
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold">Landing Pages</h1>
          <p className="text-muted-foreground mt-1">Create single-page sales funnels for your campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" disabled={selectedPages.size === 0} onClick={handleBulkDelete}>
            Bulk Delete
          </Button>
          <Button onClick={() => {
            setSelectedPage(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="text-sm md:text-base">Create New Page</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : landingPages?.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No landing pages yet</h3>
          <p className="text-muted-foreground mb-4">Create your first landing page to start selling</p>
          <Button onClick={() => {
            setSelectedPage(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Page
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={landingPages?.length > 0 && selectedPages.size === landingPages.length}
                    onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                    aria-label="Select all landing pages"
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Slug</TableHead>
                <TableHead className="hidden md:table-cell">Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {landingPages?.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedPages.has(page.id)}
                      onCheckedChange={(checked) => togglePageSelection(page.id, Boolean(checked))}
                      aria-label={`Select landing page ${page.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        /lp/{page.slug}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyLink(page.slug)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {(page.landing_page_orders as any)?.[0]?.count || 0}
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.is_active ? "default" : "secondary"}>
                      {page.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {new Date(page.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openPreview(page.slug)}
                        title="Preview"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(page)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(page.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LandingPageDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        landingPage={selectedPage}
      />
    </div>
  );
};

export default LandingPages;
