"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import PetCard from "@/components/pet-card";
import { Loader2 } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { favoriteStatus, toggleFavorite } = useFavorites();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/favorites');
        
        if (!response.ok) {
          throw new Error("Failed to fetch favorites");
        }
        
        const data = await response.json();
        const favoritesList = data.map((item: any) => ({
          id: item.pet.id,
          ...item.pet
        }));
        setFavorites(favoritesList);
      } catch (error) {
        console.error("Error fetching favorites:", error);
        toast.error("Failed to load your favorites");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [favoriteStatus]);

  const handleViewDetails = (pet_id: number) => {
    router.push(`/pets/${pet_id}`);
  };

  const handleRemoveFavorite = (pet_id: number) => {
    toggleFavorite(pet_id);
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
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  isFavorite={true}
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