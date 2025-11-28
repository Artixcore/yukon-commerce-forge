import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { showSuccess, showError } from "@/lib/sweetalert";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showError("Error", "Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      showError("Error", "Password must be at least 6 characters");
      return;
    }
    
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });
    setIsLoading(false);
    
    if (error) {
      showError("Error", error.message);
      return;
    }
    
    showSuccess("Success!", "Your password has been reset");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">Set New Password</h1>
        <p className="text-muted-foreground text-center mb-6">
          Enter your new password below
        </p>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">New Password</label>
            <Input 
              type="password" 
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Confirm Password</label>
            <Input 
              type="password" 
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
