"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PetCard from "@/components/pet-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/header";
import { useFavorites } from "@/hooks/use-favorites";

// Create a client component that uses searchParams
function PetsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pets, setPets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { favoriteStatus, toggleFavorite, checkFavoriteStatus } = useFavorites();
  
  const [filters, setFilters] = useState({
    type: searchParams.get("type") || "all",
    status: searchParams.get("status") || "all",
    name: searchParams.get("name") || "",
    health: searchParams.get("health") || "",
  });
  
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setIsLoading(true);

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (filters.type && filters.type !== "all") queryParams.append("type", filters.type);
        if (filters.status && filters.status !== "all") queryParams.append("status", filters.status);
        if (filters.name) queryParams.append("name", filters.name);
        if (filters.health) queryParams.append("health", filters.health);

        const response = await fetch(`/api/pets?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch pets");
        }

        const data = await response.json();
        setPets(data);
        
        // Check favorite status for each pet
        data.forEach((pet: any) => {
          checkFavoriteStatus(pet.id);
        });
      } catch (error) {
        console.error("Error fetching pets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPets();
  }, [filters, checkFavoriteStatus]);

  const applyFilters = () => {
    // Update URL with filters
    const queryParams = new URLSearchParams();
    if (filters.type && filters.type !== "all") queryParams.append("type", filters.type);
    if (filters.status && filters.status !== "all") queryParams.append("status", filters.status);
    if (filters.name) queryParams.append("name", filters.name);
    if (filters.health) queryParams.append("health", filters.health);

    router.push(`/pets?${queryParams.toString()}`);
  };

  const resetFilters = () => {
    setFilters({
      type: "all",
      status: "all",
      name: "",
      health: "",
    });
    router.push("/pets");
  };

  const handleFavorite = (pet_id: number) => {
    toggleFavorite(pet_id);
  };

  const handleViewDetails = (pet_id: number) => {
    router.push(`/pets/${pet_id}`);
  };

  return (
    <>
      <Header />
      <div className="mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Find a pet</h1>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Pet Type</label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="dog">Dogs</SelectItem>
                    <SelectItem value="cat">Cats</SelectItem>
                    <SelectItem value="rabbit">Rabbits</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="in_shelter">In Shelter</SelectItem>
                    <SelectItem value="adopted">Adopted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Pet Name</label>
                <Input
                  placeholder="Search by name"
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                />
              </div>

              <div className="flex items-end space-x-2">
                <Button onClick={applyFilters} className="flex-1">Apply Filters</Button>
                <Button variant="neutral" onClick={resetFilters}>Reset</Button>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium mb-1 block">Health Info</label>
              <Input
                placeholder="Search by health info (e.g. vaccinated, spayed, neutered)"
                value={filters.health}
                onChange={(e) => setFilters({ ...filters, health: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                name={pet.name}
                type={pet.type}
                sex={pet.sex}
                age={`${pet.age} ${pet.age === 1 ? "year" : "years"}`}
                breed="" // Add breed if you have it in your schema
                description={pet.description || "No description available"}
                imageSrc={pet.images && pet.images.length > 0 ? pet.images[0] : undefined}
                isFavorite={favoriteStatus[pet.id] || false}
                onFavorite={() => handleFavorite(pet.id)}
                onViewDetails={() => handleViewDetails(pet.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-60 bg-muted/30 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium">No pets found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Create a loading fallback
function PetsPageFallback() {
  return (
    <>
      <Header />
      <div className="mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Find a pet</h1>
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    </>
  );
}

// Main page component with suspense boundary
export default function PetsPage() {
  return (
    <Suspense fallback={<PetsPageFallback />}>
      <PetsPageContent />
    </Suspense>
  );
}
