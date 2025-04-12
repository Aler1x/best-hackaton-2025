"use client";

import { useState, useEffect } from "react";
import PetCard from "@/components/pet-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import Link from "next/link";

export default function LendingPets() {
  const [pets, setPets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { favoriteStatus, toggleFavorite, checkFavoriteStatus } = useFavorites();

  useEffect(() => {
    const fetchLendingPets = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/pets/lending");
        
        if (!response.ok) {
          throw new Error("Failed to fetch lending pets");
        }
        
        const data = await response.json();
        setPets(data);
        
        // Check favorite status for each pet
        data.forEach((pet: any) => {
          checkFavoriteStatus(pet.id);
        });
      } catch (error) {
        console.error("Error fetching lending pets:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLendingPets();
  }, [checkFavoriteStatus]);

  const handleFavorite = (petId: number) => {
    toggleFavorite(petId);
  };

  const handleViewDetails = (petId: number) => {
    window.location.href = `/pets/${petId}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No pets available for lending at the moment.</p>
        <Link href="/pets">
          <Button>Browse All Pets</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {pets.map((pet) => (
        <PetCard
          key={pet.id}
          name={pet.name}
          type={pet.type}
          sex={pet.sex}
          age={`${pet.age} ${pet.age === 1 ? "year" : "years"}`}
          breed=""
          description={pet.description || "No description available"}
          imageSrc={pet.images && pet.images.length > 0 ? pet.images[0] : undefined}
          isFavorite={favoriteStatus[pet.id] || false}
          onFavorite={() => handleFavorite(pet.id)}
          onViewDetails={() => handleViewDetails(pet.id)}
        />
      ))}
    </div>
  );
} 