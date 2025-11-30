import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError, showLoading, closeLoading } from "@/lib/sweetalert";
import { Shield, AlertTriangle } from "lucide-react";

const setupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SetupFormData = z.infer<typeof setupSchema>;

const SetupAdmin = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      email: "admin@yukonlifestyle.com",
    },
  });

  const onSubmit = async (data: SetupFormData) => {
    setIsSubmitting(true);
    showLoading("Setting up admin account...");

    try {
      const { data: result, error } = await supabase.functions.invoke('setup-admin', {
        body: {
          email: data.email,
          password: data.password,
        },
      });

      closeLoading();

      if (error) {
        console.error("Setup error:", error);
        showError(
          "Setup Failed",
          error.message || "Failed to setup admin account. Please try again."
        );
        return;
      }

      if (result?.error) {
        showError("Setup Failed", result.error);
        return;
      }

      await showSuccess(
        "Admin Setup Complete!",
        "Your admin account has been configured successfully."
      );

      navigate("/admin/login");
    } catch (error: any) {
      closeLoading();
      console.error("Setup error:", error);
      showError(
        "Setup Failed",
        error.message || "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Setup</CardTitle>
          <CardDescription>
            Configure the admin account for YUKON Lifestyle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                disabled={isSubmitting}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              Setup Admin Account
            </Button>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                <strong>Security Notice:</strong> This page is for initial setup only. 
                Remove it after successfully configuring your admin account.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupAdmin;
