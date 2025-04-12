"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";

type ShelterProfile = {
  name: string;
  description: string;
  address: string;
  phone: string;
  website: string;
  donationLink: string;
  location: { lat: number; lng: number } | null;
};

type VolunteerProfile = {
  bio: string;
  phone: string;
};

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Profile form states
  const [shelterProfile, setShelterProfile] = useState<ShelterProfile>({
    name: "",
    description: "",
    address: "",
    phone: "",
    website: "",
    donationLink: "",
    location: null,
  });
  
  const [volunteerProfile, setVolunteerProfile] = useState<VolunteerProfile>({
    bio: "",
    phone: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      // 1. Get current user and their role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      
      // 2. Get user role
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
      
      // 3. Fetch profile based on role
      if (userData.role === "shelter") {
        const { data: shelterData, error: shelterError } = await supabase
          .from("shelters")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (shelterError && shelterError.code !== "PGRST116") {
          console.error("Error fetching shelter profile:", shelterError);
        } else if (shelterData) {
          setShelterProfile({
            name: shelterData.name || "",
            description: shelterData.description || "",
            address: shelterData.address || "",
            phone: shelterData.phone || "",
            website: shelterData.website || "",
            donationLink: shelterData.donationLink || "",
            location: shelterData.location || null,
          });
        }
      } else if (userData.role === "volunteer") {
        const { data: volunteerData, error: volunteerError } = await supabase
          .from("volunteers")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (volunteerError && volunteerError.code !== "PGRST116") {
          console.error("Error fetching volunteer profile:", volunteerError);
        } else if (volunteerData) {
          setVolunteerProfile({
            bio: volunteerData.bio || "",
            phone: volunteerData.phone || "",
          });
        }
      }
    } catch (error) {
      console.error("Error in profile fetch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShelterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShelterProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleVolunteerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVolunteerProfile(prev => ({ ...prev, [name]: value }));
  };

  const saveShelterProfile = async () => {
    if (!userId) return;
    
    try {
      setIsSaving(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from("shelters")
        .upsert({
          id: userId,
          ...shelterProfile,
          updatedAt: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error saving shelter profile:", error);
      toast.error("Error saving profile", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveVolunteerProfile = async () => {
    if (!userId) return;
    
    try {
      setIsSaving(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from("volunteers")
        .upsert({
          id: userId,
          ...volunteerProfile,
          updatedAt: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error saving volunteer profile:", error);
      toast.error("Error saving profile", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLocationPick = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    // Ask for user's current location as a starting point
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setShelterProfile(prev => ({ ...prev, location }));
        toast.success("Location updated", {
          description: "You can fine-tune this location in your shelter details page",
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Could not get your location", {
          description: "Please try again or enter your coordinates manually",
        });
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {userRole === "shelter" ? "Shelter Profile" : "Volunteer Profile"}
        </h1>
        <p className="text-muted-foreground">
          {userRole === "shelter" 
            ? "Manage your shelter's information visible to potential adopters"
            : "Update your volunteer profile information"}
        </p>
      </div>

      {userRole === "shelter" && (
        <Card>
          <CardHeader>
            <CardTitle>Shelter Information</CardTitle>
            <CardDescription>
              This information will be shown to users browsing for pets to adopt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shelter Name</Label>
              <Input
                id="name"
                name="name"
                value={shelterProfile.name}
                onChange={handleShelterChange}
                placeholder="Your shelter's name"
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={shelterProfile.description || ""}
                onChange={handleShelterChange}
                placeholder="Tell potential adopters about your shelter"
                rows={4}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={shelterProfile.address || ""}
                onChange={handleShelterChange}
                placeholder="Shelter's physical address"
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={shelterProfile.phone || ""}
                onChange={handleShelterChange}
                placeholder="+1 (555) 123-4567"
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                value={shelterProfile.website || ""}
                onChange={handleShelterChange}
                placeholder="https://yourshelter.org"
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="donationLink">Donation Link</Label>
              <Input
                id="donationLink"
                name="donationLink"
                value={shelterProfile.donationLink || ""}
                onChange={handleShelterChange}
                placeholder="https://yourshelter.org/donate"
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Shelter Location</Label>
              <div className="border rounded-md p-4">
                {shelterProfile.location ? (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>
                        Latitude: {shelterProfile.location.lat.toFixed(6)}, 
                        Longitude: {shelterProfile.location.lng.toFixed(6)}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLocationPick}>
                      Update Location
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 space-y-2">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      No location set. This helps adopters find pets near them.
                    </p>
                    <Button variant="outline" size="sm" onClick={handleLocationPick}>
                      Use Current Location
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={saveShelterProfile}
              disabled={isSaving}
              className="ml-auto"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {userRole === "volunteer" && (
        <Card>
          <CardHeader>
            <CardTitle>Volunteer Information</CardTitle>
            <CardDescription>
              Update your personal information and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                name="bio"
                value={volunteerProfile.bio || ""}
                onChange={handleVolunteerChange}
                placeholder="Tell us a bit about yourself and why you want to adopt"
                rows={4}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={volunteerProfile.phone || ""}
                onChange={handleVolunteerChange}
                placeholder="+1 (555) 123-4567"
                disabled={isSaving}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={saveVolunteerProfile}
              disabled={isSaving}
              className="ml-auto"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 