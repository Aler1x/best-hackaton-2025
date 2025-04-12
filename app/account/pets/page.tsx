"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import AddButton from "@/components/add-button";
import PetForm from "@/components/pet-form";

interface Pet {
  id: number;
  name: string;
  type: string;
  sex: string;
  age: number;
  status: string;
  description?: string;
  health?: string;
  images?: string[];
  shelterId: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        // Check if user is logged in
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/auth/signin");
          return;
        }

        setUserId(user.id);

        // Get shelter's pets
        const response = await fetch(`/api/pets?shelterId=${user.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch pets");
        }
        
        const data = await response.json();
        setPets(data);
      } catch (error) {
        console.error("Error fetching pets:", error);
        toast.error("Failed to load your pets");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPets();
  }, [router]);

  const handleDeletePet = async (id: number) => {
    if (!confirm("Are you sure you want to delete this pet?")) {
      return;
    }

    try {
      const response = await fetch(`/api/pets?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete pet");
      }

      // Remove the deleted pet from state
      setPets(pets.filter((pet) => pet.id !== id));
      
      toast.success("Pet deleted successfully");
    } catch (error) {
      console.error("Error deleting pet:", error);
      toast.error("Failed to delete pet");
    }
  };

  const handleAddPet = async (petData: any) => {
    try {
      const response = await fetch("/api/pets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(petData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create pet");
      }

      const newPet = await response.json();
      
      // Add the new pet to the list
      setPets((prevPets) => [newPet, ...prevPets]);
      
      toast.success("Pet added successfully");
      return true;
    } catch (error: any) {
      console.error("Error creating pet:", error);
      toast.error(error.message || "Failed to create pet");
      return false;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "waiting":
        return "default";
      case "in_shelter":
        return "neutral";
      case "adopted":
        return "neutral";
      default:
        return "default";
    }
  };

  const renderPetsTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Sex</TableHead>
          <TableHead>Age</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Added</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pets.map((pet) => (
          <TableRow key={pet.id}>
            <TableCell className="font-medium">{pet.name}</TableCell>
            <TableCell>{pet.type}</TableCell>
            <TableCell>{pet.sex}</TableCell>
            <TableCell>{pet.age}</TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(pet.status)}>
                {pet.status === "in_shelter" ? "In Shelter" : 
                  pet.status.charAt(0).toUpperCase() + pet.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(pet.createdAt)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button
                  variant="neutral"
                  size="icon"
                  onClick={() => router.push(`/pets/${pet.id}`)}
                >
                  <span className="sr-only">View</span>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="neutral"
                  size="icon"
                  onClick={() => router.push(`/pets/${pet.id}/edit`)}
                >
                  <span className="sr-only">Edit</span>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeletePet(pet.id)}
                >
                  <span className="sr-only">Delete</span>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Pets</h1>
          <p className="text-muted-foreground">Manage your shelter's pets</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <p>Loading pets...</p>
            </div>
          ) : pets.length > 0 ? (
            renderPetsTable()
          ) : (
            <div className="flex flex-col items-center justify-center h-60">
              <p className="text-muted-foreground mb-4">You don't have any pets yet.</p>
              <p className="text-sm text-muted-foreground">
                Click the + button to add your first pet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddButton title="Add New Pet" description="Fill in the details to add a new pet to your shelter.">
        <PetForm onSubmit={handleAddPet} shelterId={userId} />
      </AddButton>
    </div>
  );
} 