import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const Setup = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSetup = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('setup-admin', {
        body: { setupKey: 'yukon-admin-setup-2025' }
      });

      if (error) throw error;

      setResult({
        success: data.success,
        message: data.success ? 'Admin user created successfully! You can now login with admin@yukon.com' : data.error
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to create admin user'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>
            Initialize the admin user for your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This will create an admin user with email: <strong>admin@yukon.com</strong>
              <br />
              Password: <strong>Admin**11**22##</strong>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleSetup} 
            disabled={loading || result?.success}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {result?.success ? 'Setup Complete' : 'Create Admin User'}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          {result?.success && (
            <Alert>
              <AlertDescription>
                ⚠️ <strong>Important:</strong> Delete this setup page and the setup-admin edge function after use for security.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;
