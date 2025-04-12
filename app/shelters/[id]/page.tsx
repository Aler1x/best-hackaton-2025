"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, MapPinIcon, PhoneIcon, GlobeIcon, HeartIcon, BuildingIcon, MailIcon } from "lucide-react";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import PetCard from "@/components/pet-card";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/hooks/use-favorites";

export default function ShelterDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const shelter_id = params.id as string;

  const [shelter, setShelter] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { favoriteStatus, toggleFavorite, checkFavoriteStatus } = useFavorites();

  useEffect(() => {
    const fetchShelterDetails = async () => {
      try {
        setIsLoading(true);

        // Fetch shelter details
        const shelterResponse = await fetch(`/api/shelters/${shelter_id}`);
        if (!shelterResponse.ok) {
          throw new Error("Failed to fetch shelter details");
        }
        const shelterData = await shelterResponse.json();
        setShelter(shelterData);

        // Fetch shelter's pets
        const petsResponse = await fetch(`/api/pets?shelter=${shelter_id}`);
        if (petsResponse.ok) {
          const petsData = await petsResponse.json();
          setPets(petsData);
          
          // Check favorite status for each pet
          petsData.forEach((pet: any) => {
            checkFavoriteStatus(pet.id);
          });
        }
      } catch (error) {
        console.error("Error fetching shelter details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (shelter_id) {
      fetchShelterDetails();
    }
  }, [shelter_id, checkFavoriteStatus]);

  const handleBackToList = () => {
    router.push("/shelters");
  };

  const handlePetDetails = (pet_id: number) => {
    router.push(`/pets/${pet_id}`);
  };
  
  const handleFavorite = (pet_id: number) => {
    toggleFavorite(pet_id);
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-[calc(100vh-70px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!shelter) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-12 px-4">
          <Button onClick={handleBackToList} variant="neutral" className="mb-6">
            Back to shelters
          </Button>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Shelter not found</h2>
            <p className="text-muted-foreground">The shelter you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-8 px-4">
        <Button onClick={handleBackToList} variant="neutral" className="mb-6">
          Back to shelters
        </Button>

        <div className="bg-background rounded-lg border-2 border-border p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <BuildingIcon className="h-6 w-6" />
                {shelter.name}
              </h1>
              
              {shelter.address && (
                <p className="text-muted-foreground mb-4 flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4" />
                  {shelter.address}
                </p>
              )}
              
              <div className="prose max-w-none mb-6">
                {shelter.description ? (
                  <p>{shelter.description}</p>
                ) : (
                  <p className="text-muted-foreground">No description available.</p>
                )}
              </div>
              
              {/* Contact Information Section */}
              <div className="bg-muted/20 p-4 rounded-lg mb-6">
                <h2 className="font-semibold text-lg mb-3">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shelter.phone && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4" />
                      <a href={`tel:${shelter.phone}`} className="text-primary hover:underline">{shelter.phone}</a>
                    </div>
                  )}
                
                  
                  {shelter.website && (
                    <div className="flex items-center gap-2">
                      <GlobeIcon className="h-4 w-4" />
                      <a 
                        href={shelter.website.startsWith('http') ? shelter.website : `https://${shelter.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {shelter.donation_link && (
                <Button className="w-full md:w-auto" asChild>
                  <a 
                    href={shelter.donation_link.startsWith('http') ? shelter.donation_link : `https://${shelter.donation_link}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Donate to this shelter
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Pets at this shelter</h2>
        
        {pets.length > 0 ? (
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
                onViewDetails={() => handlePetDetails(pet.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">This shelter doesn't have any pets listed yet.</p>
          </div>
        )}
      </div>
    </>
  );
} 