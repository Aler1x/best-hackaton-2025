"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import PetCard from "@/components/pet-card";

interface Pet {
  id: number;
  name: string;
  type: string;
  sex: string;
  age: number;
  description?: string;
  images?: string[];
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        // Check if user is logged in
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/auth/signin");
          return;
        }

        // Get user's favorites from the API
        const response = await fetch(`/api/favorites`);
        if (!response.ok) {
          throw new Error("Failed to fetch favorites");
        }
        
        const data = await response.json();
        setFavorites(data);
      } catch (error) {
        console.error("Error fetching favorites:", error);
        toast.error("Failed to load your favorites");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [router]);

  const handleRemoveFavorite = async (petId: number) => {
    try {
      const response = await fetch(`/api/favorites/${petId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove from favorites");
      }

      // Remove from state
      setFavorites(favorites.filter(pet => pet.id !== petId));
      
      toast.success("Removed from favorites");
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Failed to remove from favorites");
    }
  };

  const handleViewDetails = (petId: number) => {
    router.push(`/pets/${petId}`);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Favorite Pets</h1>
        <p className="text-muted-foreground">Pets you've saved for later</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <p>Loading favorites...</p>
            </div>
          ) : favorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((pet) => (
                <PetCard
                  key={pet.id}
                  name={pet.name}
                  type={pet.type}
                  sex={pet.sex}
                  age={`${pet.age} ${pet.age === 1 ? "year" : "years"}`}
                  breed="" // Add breed if you have it in your schema
                  description={pet.description || "No description available"}
                  imageSrc={pet.images && pet.images.length > 0 ? pet.images[0] : undefined}
                  onFavorite={() => handleRemoveFavorite(pet.id)}
                  onViewDetails={() => handleViewDetails(pet.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-60">
              <p className="text-muted-foreground mb-2">You haven't added any pets to your favorites yet.</p>
              <p className="text-sm text-muted-foreground">
                Browse pets and click the heart icon to add them to your favorites.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 