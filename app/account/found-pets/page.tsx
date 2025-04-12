"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  PlusCircle, 
  MapPin, 
  PawPrint, 
  Calendar, 
  Clock, 
  AlertCircle,
  Pencil,
  Trash,
  Image
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FoundPet = {
  id: number;
  volunteerId: string;
  type: string;
  description: string;
  location: { lat: number; lng: number; } | null;
  status: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

export default function FoundPetsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [foundPets, setFoundPets] = useState<FoundPet[]>([]);
  
  // New found pet form state
  const [newPet, setNewPet] = useState({
    type: "cat",
    description: "",
    location: null as { lat: number; lng: number; } | null,
    images: [] as string[]
  });
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/signin?next=/account/found-pets");
        return;
      }
      
      setUserId(user.id);
      
      // Check if user is a volunteer
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (userError || userData?.role !== "volunteer") {
        toast.error("Access denied", {
          description: "Only volunteers can access this page"
        });
        router.push("/account");
        return;
      }
      
      // Fetch found pets
      await fetchFoundPets(user.id);
      
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFoundPets = async (userId: string) => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("found_pets")
        .select("*")
        .eq("volunteerId", userId)
        .order("createdAt", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setFoundPets(data || []);
    } catch (error) {
      console.error("Error fetching found pets:", error);
      toast.error("Failed to load found pets");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Get the selected files and add them to the state
    const newFiles = Array.from(e.target.files);
    
    // Check file types
    const validFiles = newFiles.filter(file => 
      file.type === "image/jpeg" || 
      file.type === "image/png" || 
      file.type === "image/webp"
    );
    
    if (validFiles.length !== newFiles.length) {
      toast.error("Some files were not added", {
        description: "Only JPEG, PNG, and WebP images are supported"
      });
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const handleLocationPick = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    // Ask for user's current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setNewPet(prev => ({ ...prev, location }));
        toast.success("Location updated", {
          description: "Current location has been set"
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Could not get your location", {
          description: "Please try again or enter your location manually"
        });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error("You must be signed in to report a found pet");
      return;
    }
    
    if (!newPet.description.trim()) {
      toast.error("Please provide a description of the found pet");
      return;
    }
    
    if (!newPet.location) {
      toast.error("Please set a location where the pet was found");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const supabase = createClient();
      
      // 1. Upload images if any
      let imageUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `found-pets/${fileName}`;
          
          const { error: uploadError, data } = await supabase.storage
            .from('images')
            .upload(filePath, file);
          
          if (uploadError) {
            throw uploadError;
          }
          
          // Get public URL for the uploaded image
          const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);
            
          imageUrls.push(urlData.publicUrl);
          
          // Update progress
          setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
        }
        
        setIsUploading(false);
      }
      
      // 2. Create the found pet record
      const { data, error } = await supabase
        .from("found_pets")
        .insert({
          volunteerId: userId,
          type: newPet.type,
          description: newPet.description,
          location: newPet.location,
          status: "reported",
          images: imageUrls,
        })
        .select();
      
      if (error) throw error;
      
      // 3. Reset form and fetch updated list
      setNewPet({
        type: "cat",
        description: "",
        location: null,
        images: []
      });
      setSelectedFiles([]);
      setUploadProgress(0);
      
      await fetchFoundPets(userId);
      
      toast.success("Found pet reported successfully", {
        description: "Thank you for helping this animal!"
      });
      
    } catch (error: any) {
      console.error("Error reporting found pet:", error);
      toast.error("Failed to report found pet", {
        description: error.message || "Please try again"
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "reported":
        return "bg-yellow-100 text-yellow-800";
      case "processed":
        return "bg-blue-100 text-blue-800";
      case "rescued":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "reported":
        return "Recently Reported";
      case "processed":
        return "Being Processed";
      case "rescued":
        return "Rescued";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Found Pets</h1>
        <p className="text-muted-foreground">
          Report stray animals you've found to help them get rescued
        </p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">My Reports</TabsTrigger>
          <TabsTrigger value="new">Report New Pet</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          {foundPets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <PawPrint className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No found pets reported yet</h3>
                <p className="text-muted-foreground mb-6">
                  When you report stray animals you've found, they'll appear here
                </p>
                <Button onClick={() => {
                  const element = document.querySelector('[data-value="new"]');
                  if (element instanceof HTMLElement) {
                    element.click();
                  }
                }}>
                  Report a Found Pet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {foundPets.map((pet) => (
                <Card key={pet.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="capitalize">{pet.type}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(pet.createdAt)}
                        </CardDescription>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(pet.status)}`}>
                        {getStatusLabel(pet.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {pet.images && pet.images.length > 0 && (
                      <div className="relative h-40 mb-4 overflow-hidden rounded-md bg-muted">
                        <img 
                          src={pet.images[0]} 
                          alt="Found pet" 
                          className="h-full w-full object-cover"
                        />
                        {pet.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-background/80 text-xs px-2 py-1 rounded-full">
                            +{pet.images.length - 1} more
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="text-sm mb-4">{pet.description}</p>
                    
                    {pet.location && (
                      <div className="flex items-center text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>
                          {pet.location.lat.toFixed(6)}, {pet.location.lng.toFixed(6)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="new" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Report a Found Pet</CardTitle>
              <CardDescription>
                Provide details about a stray animal you've discovered
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pet-type">Pet Type</Label>
                  <Select 
                    value={newPet.type} 
                    onValueChange={(value) => setNewPet(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pet type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="rabbit">Rabbit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newPet.description}
                    onChange={(e) => setNewPet(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the animal (color, size, distinguishing features, condition, etc.)"
                    rows={4}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Location Found</Label>
                  <div className="border rounded-md p-4">
                    {newPet.location ? (
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>
                            Latitude: {newPet.location.lat.toFixed(6)}, 
                            Longitude: {newPet.location.lng.toFixed(6)}
                          </span>
                        </div>
                        <Button type="button" variant="neutral" size="sm" onClick={handleLocationPick}>
                          Update Location
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 space-y-2">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center">
                          Set the location where you found this pet.
                        </p>
                        <Button type="button" variant="neutral" size="sm" onClick={handleLocationPick}>
                          Use Current Location
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="images">Images (Optional)</Label>
                  <div className="border rounded-md p-4">
                    {selectedFiles.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="relative h-20 w-20 rounded-md bg-muted overflow-hidden">
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt={`Selected ${index}`} 
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center"
                                onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                              >
                                <Trash className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {selectedFiles.length < 5 && (
                            <label className="flex items-center justify-center h-20 w-20 rounded-md border-2 border-dashed cursor-pointer">
                              <PlusCircle className="h-8 w-8 text-muted-foreground" />
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleFileChange}
                              />
                            </label>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedFiles.length}/5 images selected
                        </p>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center py-6 cursor-pointer">
                        <Image className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium mb-1">Add photos of the pet</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Upload up to 5 images (JPEG, PNG, WebP)
                        </p>
                        <Button type="button" variant="neutral" size="sm">
                          Select Images
                        </Button>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <div className="p-4 border rounded-lg bg-amber-50 text-amber-800">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium">Information for Rescuers</p>
                      <p className="text-xs mt-1">
                        Please provide as much detail as possible, including the animal's condition, 
                        exact location, and your contact information for follow-up. Once reported, 
                        local rescue organizations will be notified.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="ml-auto"
                >
                  {isSubmitting ? "Submitting..." : "Report Found Pet"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 