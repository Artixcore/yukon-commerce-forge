import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut, Store, Plus, User, Search, Phone } from "lucide-react";
import { showSuccess, showError, showConfirmation } from "@/lib/sweetalert";
import logo from "@/assets/logo.png";

export const AdminHeader = () => {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  // Get admin email
  supabase.auth.getUser().then(({ data }) => {
    if (data.user) {
      setAdminEmail(data.user.email || null);
    }
  });

  const handleLogout = async () => {
    const confirmed = await showConfirmation(
      'Logout?',
      'Are you sure you want to logout?',
      'Yes, logout'
    );
    
    if (!confirmed) return;
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Logout Failed", "Error logging out");
    } else {
      showSuccess("Logged Out", "You have been logged out successfully");
      navigate("/admin/login");
    }
  };

  const handleViewStore = () => {
    window.open("/", "_blank");
  };

  return (
    <header className="h-16 border-b bg-background sticky top-0 z-50">
      <div className="h-full px-4 flex items-center justify-between gap-2">
        {/* Sidebar Trigger + Logo */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Sidebar Trigger - Always Visible */}
          <SidebarTrigger />
          
          {/* Logo with Primary Background on Mobile */}
          <div className="flex items-center gap-2 md:gap-3 bg-primary md:bg-transparent px-3 py-2 md:p-0 rounded">
            <img 
              src={logo} 
              alt="Yukon Admin" 
              className="h-6 md:h-8 w-auto brightness-0 invert md:brightness-100 md:invert-0" 
            />
            <span className="hidden md:inline text-lg font-semibold">Admin Panel</span>
          </div>
        </div>

        {/* Mobile: Compact Search Bar */}
        <div className="flex-1 max-w-md mx-2 md:hidden">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search..."
              className="pr-10 h-9"
            />
            <Button
              size="sm"
              className="absolute right-0 top-0 h-9 px-3 rounded-l-none"
              variant="default"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Desktop Only Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewStore}
            className="hidden md:flex"
          >
            <Store className="h-4 w-4 mr-2" />
            View Store
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/products")}
            className="hidden md:flex"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>

          {/* Mobile: Phone Icon Button */}
          <Button
            size="icon"
            className="md:hidden h-9 w-9"
            variant="default"
            onClick={handleViewStore}
          >
            <Phone className="h-4 w-4" />
          </Button>

          {/* User Dropdown - Both Mobile & Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="default" 
                size="sm"
                className="md:bg-transparent md:text-foreground md:hover:bg-accent md:hover:text-accent-foreground h-9"
              >
                <User className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{adminEmail || "Admin"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Admin Account</span>
                  <span className="text-xs text-muted-foreground">{adminEmail}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleViewStore}>
                <Store className="h-4 w-4 mr-2" />
                View Store
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
