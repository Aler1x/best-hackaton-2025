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
import { AlertCircle, PawPrint, Users, Heart, Bell, Calendar, Clock } from "lucide-react";
import Link from "next/link";

export default function AccountPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Statistics state
  const [stats, setStats] = useState({
    // Shelter stats
    totalPets: 0,
    adoptionRequests: 0,
    // Volunteer stats
    favorites: 0,
    alerts: 0,
    foundPets: 0
  });
  
  // Recent activity state
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

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
        
        // Get user role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (userError) {
          console.error("Error fetching user role:", userError);
          return;
        }
        
        setUserRole(userData.role);
        
        // Fetch user statistics based on role
        await fetchUserStats(user.id, userData.role);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);
  
  const fetchUserStats = async (userId: string, role: string) => {
    const supabase = createClient();
    
    try {
      if (role === "shelter") {
        // Fetch shelter stats
        const { data: petsData, error: petsError } = await supabase
          .from("pets")
          .select("id", { count: 'exact' })
          .eq("shelterId", userId);
        
        if (!petsError) {
          setStats(prev => ({ ...prev, totalPets: petsData?.length || 0 }));
        }
        
        // Fetch adoption requests count
        const { count: requestsCount, error: requestsError } = await supabase
          .from("adoption_requests")
          .select("*", { count: 'exact', head: true })
          .eq("petId", "pets.id")
          .eq("pets.shelterId", userId);
        
        if (!requestsError) {
          setStats(prev => ({ ...prev, adoptionRequests: requestsCount || 0 }));
        }
        
        // Fetch recent activity
        const { data: activity, error: activityError } = await supabase
          .from("adoption_requests")
          .select(`
            id,
            status,
            created_at,
            pets:petId(
              name
            )
          `)
          .eq("pets.shelterId", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        
        if (!activityError && activity) {
          setRecentActivity(activity);
        }
      } else if (role === "volunteer") {
        // Fetch volunteer stats
        const { count: favoritesCount, error: favoritesError } = await supabase
          .from("favorites")
          .select("*", { count: 'exact', head: true })
          .eq("volunteerId", userId);
        
        if (!favoritesError) {
          setStats(prev => ({ ...prev, favorites: favoritesCount || 0 }));
        }
        
        const { count: alertsCount, error: alertsError } = await supabase
          .from("pet_alerts")
          .select("*", { count: 'exact', head: true })
          .eq("volunteerId", userId)
          .eq("active", true);
        
        if (!alertsError) {
          setStats(prev => ({ ...prev, alerts: alertsCount || 0 }));
        }
        
        const { count: foundPetsCount, error: foundPetsError } = await supabase
          .from("found_pets")
          .select("*", { count: 'exact', head: true })
          .eq("volunteerId", userId);
        
        if (!foundPetsError) {
          setStats(prev => ({ ...prev, foundPets: foundPetsCount || 0 }));
        }
        
        // Fetch recent favorites activity
        const { data: activity, error: activityError } = await supabase
          .from("favorites")
          .select(`
            id,
            created_at,
            pets:petId(
              name
            )
          `)
          .eq("volunteerId", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        
        if (!activityError && activity) {
          setRecentActivity(activity);
        }
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

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
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <h1 className="text-3xl font-bold">Account Dashboard</h1>
        <p className="text-muted-foreground">
          {userRole === "shelter" ? "Manage your shelter account and pets" : "Manage your volunteer account and activities"}
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {userRole === "shelter" && (
          <>
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <PawPrint className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Total Pets</p>
                  <p className="text-2xl font-bold">{stats.totalPets}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Adoption Requests</p>
                  <p className="text-2xl font-bold">{stats.adoptionRequests}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="mr-4 rounded-full bg-primary/10 p-2">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Manage Pets</p>
                </div>
                <div className="mt-4">
                  <Link href="/account/pets">
                    <Button className="w-full">View All Pets</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        
        {userRole === "volunteer" && (
          <>
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Saved Pets</p>
                  <p className="text-2xl font-bold">{stats.favorites}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Active Alerts</p>
                  <p className="text-2xl font-bold">{stats.alerts}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <PawPrint className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Found Pets Reported</p>
                  <p className="text-2xl font-bold">{stats.foundPets}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            {userRole === "shelter" 
              ? "Recent adoption requests for your pets" 
              : "Your recently saved pets"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start justify-between border-b pb-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-2">
                      {userRole === "shelter" ? (
                        <Users className="h-4 w-4 text-primary" />
                      ) : (
                        <Heart className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {userRole === "shelter" 
                          ? `Adoption request for ${item.pets?.name || 'Unknown pet'}` 
                          : `You saved ${item.pets?.name || 'Unknown pet'}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {userRole === "shelter" ? `Status: ${item.status || 'Pending'}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-2">No recent activity</p>
              {userRole === "shelter" ? (
                <p className="text-sm">Add pets to your shelter to start receiving adoption requests</p>
              ) : (
                <p className="text-sm">Browse and save pets to see them here</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
              
              <div className="pt-2">
                <Link href="/account/profile">
                  <Button variant="neutral">
                    Edit {userRole === "shelter" ? "Shelter" : "Volunteer"} Profile
                  </Button>
                </Link>
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
