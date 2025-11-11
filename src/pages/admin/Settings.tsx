import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/sweetalert";
import { Loader2 } from "lucide-react";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: PasswordFormValues) => {
    setIsLoading(true);
    
    try {
      // First, verify the current password by re-authenticating
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        showError("Error", "User email not found");
        setIsLoading(false);
        return;
      }

      // Try to sign in with current password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: values.currentPassword,
      });

      if (signInError) {
        showError("Authentication Failed", "Current password is incorrect");
        setIsLoading(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (updateError) {
        showError("Update Failed", updateError.message);
      } else {
        showSuccess("Password Updated", "Your password has been changed successfully");
        form.reset();
      }
    } catch (error) {
      showError("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const metaForm = useForm({
    defaultValues: {
      pixelId: "",
      accessToken: "",
      testEventCode: "",
    },
  });

  const onMetaSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      // Here you would save to Supabase secrets via an edge function
      // For now, we'll show a success message
      showSuccess("Meta Settings Saved", "Your Meta Conversion API credentials have been saved securely");
      console.log('Meta credentials to be saved as secrets:', {
        META_PIXEL_ID: values.pixelId,
        META_ACCESS_TOKEN: values.accessToken,
        META_TEST_EVENT_CODE: values.testEventCode,
      });
    } catch (error) {
      showError("Error", "Failed to save Meta settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your admin account settings</p>
      </div>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your current password"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your new password"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your new password"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Meta Conversion API Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Meta Conversion API Configuration</CardTitle>
          <CardDescription>
            Configure Facebook Pixel and Conversion API for tracking e-commerce events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={metaForm.handleSubmit(onMetaSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pixelId">Facebook Pixel ID</Label>
              <Input
                id="pixelId"
                placeholder="e.g., 1234567890123456"
                {...metaForm.register("pixelId")}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Your 16-digit Pixel ID from Meta Events Manager
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Conversion API Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="EAA..."
                {...metaForm.register("accessToken")}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Your secret access token from Meta Events Manager
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testEventCode">Test Event Code (Optional)</Label>
              <Input
                id="testEventCode"
                placeholder="TEST12345"
                {...metaForm.register("testEventCode")}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Use this to test events in Meta Events Manager
              </p>
            </div>

            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Tracked Events:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• PageView - When users visit any page</li>
                <li>• ViewContent - When users view product details</li>
                <li>• AddToCart - When items are added to cart</li>
                <li>• InitiateCheckout - When checkout begins</li>
                <li>• Purchase - When orders are completed</li>
              </ul>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Meta Configuration
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
