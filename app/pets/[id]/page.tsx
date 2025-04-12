"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Heart } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useFavorites } from "@/hooks/use-favorites";
import { useParams } from "next/navigation";

export default function PetDetailPage() {
  const params = useParams();

  if (!params.id || typeof params.id !== 'string') {
    return <div>No pet ID provided</div>;
  }

  const [pet, setPet] = useState<any>(null);
  const [shelter, setShelter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShelterOwner, setIsShelterOwner] = useState(false);
  const router = useRouter();
  const petId = parseInt(params.id);
  const { favoriteStatus, toggleFavorite, checkFavoriteStatus } = useFavorites();

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const response = await fetch(`/api/pets/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch pet");
        }
        
        const data = await response.json();
        setPet(data.pet);
        setShelter(data.shelter);
        
        // Check favorite status
        await checkFavoriteStatus(petId);
        
        // Check if current user is the shelter owner
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && data.pet.shelter_id === user.id) {
          setIsShelterOwner(true);
        }
      } catch (error) {
        console.error("Error fetching pet:", error);
        toast.error("Failed to load pet information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPet();
  }, [params.id, petId, checkFavoriteStatus]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this pet?")) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/pets?id=${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete pet");
      }

      toast.success("Pet deleted successfully");
      
      router.push("/account/pets");
    } catch (error: any) {
      console.error("Error deleting pet:", error);
      toast.error("Failed to delete pet");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleToggleFavorite = () => {
    toggleFavorite(petId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-60">
              <p>Loading pet information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-60">
              <p>Pet not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Pet Images */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-4">
              {pet.images && pet.images.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative h-80 w-full rounded-lg overflow-hidden">
                    <Image
                      src={pet.images[0]}
                      alt={pet.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {pet.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {pet.images.slice(1, 5).map((image: string, i: number) => (
                        <div
                          key={i}
                          className="relative h-20 w-full rounded-md overflow-hidden"
                        >
                          <Image
                            src={image}
                            alt={`${pet.name} - image ${i + 2}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 bg-secondary">
                  <p className="text-muted-foreground">No images available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pet Details */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">{pet.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge>{pet.type}</Badge>
                  <Badge variant="neutral">{pet.status}</Badge>
                </div>
              </div>
              {isShelterOwner && (
                <div className="flex space-x-2">
                  <Button
                    variant="neutral"
                    size="icon"
                    onClick={() => router.push(`/pets/${params.id}/edit`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Sex</h3>
                    <p className="mt-1">{pet.sex}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Age</h3>
                    <p className="mt-1">{pet.age} {pet.age === 1 ? "year" : "years"}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="mt-1 whitespace-pre-line">{pet.description}</p>
                </div>

                {pet.health && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Health Information</h3>
                    <p className="mt-1 whitespace-pre-line">{pet.health}</p>
                  </div>
                )}

                {shelter && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Shelter</h3>
                    <div className="mt-1">
                      <p className="font-medium">{shelter.name}</p>
                      {shelter.address && <p className="text-sm">{shelter.address}</p>}
                      {shelter.phone && <p className="text-sm">Phone: {shelter.phone}</p>}
                      {shelter.website && (
                        <p className="text-sm">
                          <a
                            href={shelter.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Visit Website
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <Button onClick={() => router.push("/pets")}>
                    Back to All Pets
                  </Button>
                  {!isShelterOwner && (
                    <Button 
                      className={`flex items-center space-x-2 ${favoriteStatus[petId] ? 'bg-red-500 hover:bg-red-600' : ''}`}
                      onClick={handleToggleFavorite}
                    >
                      <Heart className="h-4 w-4" fill={favoriteStatus[petId] ? "currentColor" : "none"} />
                      <span>{favoriteStatus[petId] ? "Remove from Favorites" : "Add to Favorites"}</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 