"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import PetForm from "@/components/pet-form";
import { createClient } from "@/utils/supabase/client";

export default function AddPetPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [user_id, setUserId] = useState<string | null>(null);

  // Check for the shelter's user ID
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      } else {
        toast.error("You must be signed in to add a pet");
        router.push("/login");
      }
    };
    
    checkUser();
  }, [router]);

  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!values.name || !values.type || !values.sex) {
        throw new Error("Please fill out all required fields");
      }

      const response = await fetch("/api/pets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create pet");
      }

      toast.success("Pet added successfully");
      
      router.push("/account/pets");
      return true;
    } catch (error: any) {
      console.error("Error creating pet:", error);
      toast.error(error.message || "Failed to create pet");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Add New Pet</h1>
          <p className="text-muted-foreground">
            Add a new pet to your shelter for adoption
          </p>
        </div>
        <Button variant="neutral" onClick={() => router.push("/account/pets")} className="sm:self-start">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pets
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <PetForm 
            onSubmit={handleSubmit} 
            shelter_id={user_id} 
          />
        </CardContent>
      </Card>
    </div>
  );
} 