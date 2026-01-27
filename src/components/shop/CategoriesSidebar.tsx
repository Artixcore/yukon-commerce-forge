import {Link} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {supabase} from "@/integrations/supabase/client";
import {buildCategoryTree, CategoryTree} from "@/lib/categoryUtils";
import {ChevronRight} from "lucide-react";
import {Card} from "@/components/ui/card";

export const CategoriesSidebar = () => {
    const {data: categories} = useQuery({
        queryKey: ["sidebar-categories"],
        queryFn: async () => {
            const {data, error} = await supabase
                .from("categories")
                .select("*")
                .order("name");

            if (error) throw error;
            return data;
        },
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });

    const categoryTree = categories ? buildCategoryTree(categories) : [];

    const renderCategory = (category: CategoryTree, level: number = 0): JSX.Element => {
        const hasChildren = category.children.length > 0;
        const paddingLeft = level > 0 ? `${level * 12}px` : undefined;

        return (
            <div key={category.id} style={{paddingLeft}}>
                <Link
                    to={`/shop?category=${category.id}`}
                    className="flex items-center justify-between py-2 px-3 text-sm text-foreground hover:bg-accent hover:text-primary rounded-md transition-colors group"
                >
                    <span>{category.name}</span>
                    {hasChildren &&
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"/>}
                </Link>
                {hasChildren && (
                    <div className="ml-2 mt-1 space-y-1">
                        {category.children.map((child) => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className="hidden lg:block w-64 shrink-0">
            <Card className="p-4 sticky top-20">
                <h2 className="font-bold text-lg mb-4 text-foreground">Categories</h2>
                <nav className="space-y-1">
                    {categoryTree.length > 0 ? (
                        categoryTree.map((category) => renderCategory(category))
                    ) : (
                        <div className="text-sm text-muted-foreground py-4">No categories available</div>
                    )}
                </nav>
            </Card>
        </aside>
    );
};
