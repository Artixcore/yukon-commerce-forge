import { LayoutDashboard, Package, FolderTree, ShoppingBag, Image, Star } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Categories", url: "/admin/categories", icon: FolderTree },
  { title: "Orders", url: "/admin/orders", icon: ShoppingBag },
  { title: "Reviews", url: "/admin/reviews", icon: Star },
  { title: "Hero Banners", url: "/admin/banners", icon: Image },
];

export function AdminSidebar() {
  return (
    <Sidebar>
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-foreground">YukonStore Admin</h2>
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) =>
                        cn(
                          "text-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
                          isActive && "bg-accent text-accent-foreground font-semibold"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
