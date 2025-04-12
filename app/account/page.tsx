"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/auth/signin");
          return;
        }
        
        setUser(user);
        setEmail(user.email || "");
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleSendPasswordReset = async () => {
    try {
      setIsResetting(true);
      
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Password reset email sent", {
        description: "Check your email for the password reset link",
      });
    } catch (error: any) {
      console.error("Error sending reset:", error);
      toast.error("Error", {
        description: error.message || "Failed to send reset email",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const updateUserProfile = async (values: any) => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      // Only update email if it has changed
      if (values.email !== user.email) {
        const { error } = await supabase.auth.updateUser({
          email: values.email,
        });
        
        if (error) throw error;
        
        toast.success("Email verification sent", {
          description: "Check your email to confirm your new address",
        });
      }
      
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Error", {
        description: error.message || "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading account information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account information and how we contact you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                disabled={isLoading || email === user.email} 
                onClick={() => updateUserProfile({ email })}
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Update your password to ensure your account stays secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Password Reset</p>
                    <p className="text-sm text-muted-foreground">
                      We'll send you an email with a link to reset your password.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                disabled={isResetting} 
                onClick={handleSendPasswordReset}
                className="ml-auto"
              >
                {isResetting ? "Sending..." : "Send Reset Link"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
