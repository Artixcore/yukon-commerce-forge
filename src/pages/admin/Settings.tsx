import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  const [existingCredentials, setExistingCredentials] = useState<any>(null);
  const [loadingCredentials, setLoadingCredentials] = useState(true);

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

  useEffect(() => {
    loadMetaCredentials();
  }, []);

  const loadMetaCredentials = async () => {
    setLoadingCredentials(true);
    try {
      const { data, error } = await supabase
        .from('meta_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is okay
        console.error('Error loading credentials:', error);
      } else if (data) {
        setExistingCredentials(data);
        // Pre-fill form with existing values
        metaForm.reset({
          pixelId: data.pixel_id || '',
          accessToken: '', // Don't show token for security
          testEventCode: data.test_event_code || '',
        });
        // Save to localStorage for frontend use
        localStorage.setItem('meta_pixel_id', data.pixel_id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const onMetaSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('meta_settings')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          pixel_id: values.pixelId,
          access_token: values.accessToken,
          test_event_code: values.testEventCode,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        showError("Save Failed", error.message);
      } else {
        // Save Pixel ID to localStorage for frontend tracking
        localStorage.setItem('meta_pixel_id', values.pixelId);
        
        // Reload credentials to update display
        await loadMetaCredentials();
        
        showSuccess("Meta Settings Saved", "Your Meta Conversion API credentials have been saved securely");
        
        // Clear the access token field for security
        metaForm.setValue('accessToken', '');
      }
    } catch (error: any) {
      showError("Error", error.message || "Failed to save Meta settings");
    } finally {
      setIsLoading(false);
    }
  };

  const [googleSettings, setGoogleSettings] = useState<any>(null);
  const [loadingGoogleSettings, setLoadingGoogleSettings] = useState(true);

  const googleForm = useForm({
    defaultValues: {
      gaMeasurementId: "",
      gtmContainerId: "",
      googleSiteVerification: "",
    },
  });

  useEffect(() => {
    loadGoogleSettings();
  }, []);

  const loadGoogleSettings = async () => {
    setLoadingGoogleSettings(true);
    try {
      const { data, error } = await supabase
        .from('google_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading Google settings:', error);
      } else if (data) {
        setGoogleSettings(data);
        googleForm.reset({
          gaMeasurementId: data.ga_measurement_id || '',
          gtmContainerId: data.gtm_container_id || '',
          googleSiteVerification: data.google_site_verification || '',
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingGoogleSettings(false);
    }
  };

  const onGoogleSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('google_settings')
        .upsert({
          id: '00000000-0000-0000-0000-000000000002',
          ga_measurement_id: values.gaMeasurementId,
          gtm_container_id: values.gtmContainerId,
          google_site_verification: values.googleSiteVerification,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        showError("Save Failed", error.message);
      } else {
        // Save to localStorage for dynamic script injection
        if (values.gaMeasurementId) {
          localStorage.setItem('ga_measurement_id', values.gaMeasurementId);
        }
        
        await loadGoogleSettings();
        showSuccess("Google Settings Saved", "Your Google Analytics & SEO settings have been saved successfully");
      }
    } catch (error: any) {
      showError("Error", error.message || "Failed to save Google settings");
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
          {existingCredentials && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Current Configuration</h3>
                <Badge variant="default" className="bg-green-600">✓ Configured</Badge>
              </div>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Pixel ID</TableCell>
                    <TableCell className="font-mono text-sm">
                      {existingCredentials.pixel_id}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Access Token</TableCell>
                    <TableCell className="text-muted-foreground">
                      ●●●●●●●●●●●●●●●● (hidden)
                    </TableCell>
                  </TableRow>
                  {existingCredentials.test_event_code && (
                    <TableRow>
                      <TableCell className="font-medium">Test Event Code</TableCell>
                      <TableCell className="font-mono text-sm">
                        {existingCredentials.test_event_code}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell className="font-medium">Status</TableCell>
                    <TableCell>
                      <Badge variant={existingCredentials.is_active ? "default" : "secondary"} className={existingCredentials.is_active ? "bg-green-600" : ""}>
                        {existingCredentials.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Last Updated</TableCell>
                    <TableCell className="text-sm">
                      {new Date(existingCredentials.updated_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          {!existingCredentials && !loadingCredentials && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Meta Conversion API is not configured yet. Enter your credentials below to start tracking.
              </p>
            </div>
          )}

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

      {/* Google Analytics & SEO Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Google Analytics & SEO Configuration</CardTitle>
          <CardDescription>
            Configure Google Analytics, Google Tag Manager, and Google Search Console verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {googleSettings && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Current Configuration</h3>
                <Badge variant="default" className="bg-green-600">✓ Configured</Badge>
              </div>
              <Table>
                <TableBody>
                  {googleSettings.ga_measurement_id && (
                    <TableRow>
                      <TableCell className="font-medium">GA Measurement ID</TableCell>
                      <TableCell className="font-mono text-sm">
                        {googleSettings.ga_measurement_id}
                      </TableCell>
                    </TableRow>
                  )}
                  {googleSettings.gtm_container_id && (
                    <TableRow>
                      <TableCell className="font-medium">GTM Container ID</TableCell>
                      <TableCell className="font-mono text-sm">
                        {googleSettings.gtm_container_id}
                      </TableCell>
                    </TableRow>
                  )}
                  {googleSettings.google_site_verification && (
                    <TableRow>
                      <TableCell className="font-medium">Site Verification</TableCell>
                      <TableCell className="font-mono text-sm">
                        {googleSettings.google_site_verification}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell className="font-medium">Status</TableCell>
                    <TableCell>
                      <Badge variant={googleSettings.is_active ? "default" : "secondary"} className={googleSettings.is_active ? "bg-green-600" : ""}>
                        {googleSettings.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Last Updated</TableCell>
                    <TableCell className="text-sm">
                      {new Date(googleSettings.updated_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          {!googleSettings && !loadingGoogleSettings && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Google Analytics & SEO tools are not configured yet. Enter your credentials below to start tracking.
              </p>
            </div>
          )}

          <form onSubmit={googleForm.handleSubmit(onGoogleSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gaMeasurementId">Google Analytics Measurement ID</Label>
              <Input
                id="gaMeasurementId"
                placeholder="e.g., G-XXXXXXXXXX"
                {...googleForm.register("gaMeasurementId")}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Your GA4 Measurement ID from Google Analytics
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gtmContainerId">Google Tag Manager Container ID (Optional)</Label>
              <Input
                id="gtmContainerId"
                placeholder="e.g., GTM-XXXXXXX"
                {...googleForm.register("gtmContainerId")}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Your GTM Container ID from Google Tag Manager
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleSiteVerification">Google Site Verification Code (Optional)</Label>
              <Input
                id="googleSiteVerification"
                placeholder="e.g., abc123..."
                {...googleForm.register("googleSiteVerification")}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Verification code for Google Search Console
              </p>
            </div>

            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">What gets tracked:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Page views and navigation</li>
                <li>• User interactions and events</li>
                <li>• E-commerce transactions</li>
                <li>• Traffic sources and demographics</li>
              </ul>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Google Configuration
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
