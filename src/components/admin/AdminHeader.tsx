import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Store, Plus, User } from "lucide-react";
import { toast } from "sonner";
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error logging out");
    } else {
      toast.success("Logged out successfully");
      navigate("/admin/login");
    }
  };

  const handleViewStore = () => {
    window.open("/", "_blank");
  };

  return (
    <header className="h-16 border-b bg-background sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="Yukon Admin" className="h-8 w-auto" />
          <span className="text-lg font-semibold">Admin Panel</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewStore}
            className="hidden sm:flex"
          >
            <Store className="h-4 w-4 mr-2" />
            View Store
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/products")}
            className="hidden sm:flex"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{adminEmail || "Admin"}</span>
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
