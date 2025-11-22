import { Database } from "@/integrations/supabase/types";

type Category = Database['public']['Tables']['categories']['Row'];

export interface CategoryTree extends Category {
  children: CategoryTree[];
  productCount?: number;
}

/**
 * Build a hierarchical tree structure from flat category list
 */
export function buildCategoryTree(categories: Category[]): CategoryTree[] {
  const categoryMap = new Map<string, CategoryTree>();
  const rootCategories: CategoryTree[] = [];

  // Initialize all categories with empty children array
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Build the tree by linking children to parents
  categories.forEach(category => {
    const categoryNode = categoryMap.get(category.id)!;
    
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children.push(categoryNode);
      } else {
        // Parent not found, treat as root
        rootCategories.push(categoryNode);
      }
    } else {
      // Root category
      rootCategories.push(categoryNode);
    }
  });

  // Sort by name at each level
  const sortByName = (a: CategoryTree, b: CategoryTree) => 
    a.name.localeCompare(b.name);
  
  rootCategories.sort(sortByName);
  rootCategories.forEach(root => sortChildrenRecursively(root));

  return rootCategories;
}

function sortChildrenRecursively(node: CategoryTree) {
  node.children.sort((a, b) => a.name.localeCompare(b.name));
  node.children.forEach(child => sortChildrenRecursively(child));
}

/**
 * Get full breadcrumb path for a category
 */
export function getCategoryPath(
  categoryId: string,
  categories: Category[]
): string[] {
  const path: string[] = [];
  let currentId: string | null = categoryId;

  const categoryMap = new Map(categories.map(c => [c.id, c]));

  while (currentId) {
    const category = categoryMap.get(currentId);
    if (!category) break;
    
    path.unshift(category.name);
    currentId = category.parent_id;
  }

  return path;
}

/**
 * Get all descendant IDs of a category (children, grandchildren, etc.)
 */
export function getDescendantIds(
  categoryId: string,
  categories: Category[]
): string[] {
  const descendants: string[] = [];
  const children = categories.filter(c => c.parent_id === categoryId);

  children.forEach(child => {
    descendants.push(child.id);
    descendants.push(...getDescendantIds(child.id, categories));
  });

  return descendants;
}

/**
 * Check if making category A a child of category B would create a circular reference
 */
export function wouldCreateCircularReference(
  categoryId: string,
  newParentId: string,
  categories: Category[]
): boolean {
  // Cannot be its own parent
  if (categoryId === newParentId) return true;

  // Check if newParent is a descendant of category
  const descendants = getDescendantIds(categoryId, categories);
  return descendants.includes(newParentId);
}

/**
 * Calculate the level of a category based on its parent
 */
export function calculateLevel(
  parentId: string | null,
  categories: Category[]
): number {
  if (!parentId) return 0;

  const parent = categories.find(c => c.id === parentId);
  return parent ? parent.level + 1 : 0;
}

/**
 * Get categories formatted for Select dropdown with indentation
 */
export function getCategoriesForSelect(
  categories: Category[],
  excludeIds: string[] = []
): Array<{ value: string; label: string; level: number }> {
  const tree = buildCategoryTree(categories);
  const flatList: Array<{ value: string; label: string; level: number }> = [];

  function traverse(nodes: CategoryTree[], level = 0) {
    nodes.forEach(node => {
      if (!excludeIds.includes(node.id)) {
        const indent = '　'.repeat(level); // Using ideographic space for indentation
        flatList.push({
          value: node.id,
          label: `${indent}${level > 0 ? '└─ ' : ''}${node.name}`,
          level: node.level
        });
        traverse(node.children, level + 1);
      }
    });
  }

  traverse(tree);
  return flatList;
}

/**
 * Get parent category name
 */
export function getParentCategoryName(
  parentId: string | null,
  categories: Category[]
): string {
  if (!parentId) return 'Root Category';
  const parent = categories.find(c => c.id === parentId);
  return parent?.name || 'Unknown';
}

/**
 * Count products in category and its descendants
 */
export function getCategoryProductCount(
  categoryId: string,
  products: Array<{ category_id: string | null }>
): number {
  return products.filter(p => p.category_id === categoryId).length;
}
