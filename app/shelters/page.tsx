"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ShelterCard from "@/components/shelter-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/header";

// Client component that uses searchParams
function SheltersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [shelters, setShelters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    name: searchParams.get("name") || "",
  });

  useEffect(() => {
    const fetchShelters = async () => {
      try {
        setIsLoading(true);

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (filters.name) queryParams.append("name", filters.name);

        const response = await fetch(`/api/shelters?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch shelters");
        }

        const data = await response.json();
        setShelters(data);
      } catch (error) {
        console.error("Error fetching shelters:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShelters();
  }, [filters]);

  const applyFilters = () => {
    // Update URL with filters
    const queryParams = new URLSearchParams();
    if (filters.name) queryParams.append("name", filters.name);

    router.push(`/shelters?${queryParams.toString()}`);
  };

  const resetFilters = () => {
    setFilters({
      name: "",
    });
    router.push("/shelters");
  };

  const handleViewDetails = (shelter_id: string) => {
    // Navigate to shelter details page
    router.push(`/shelters/${shelter_id}`);
  };

  return (
    <>
      <Header />
      <div className="mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Find Shelters</h1>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Shelter Name</label>
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
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : shelters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {shelters.map((shelter) => (
              <ShelterCard
                key={shelter.id}
                id={shelter.id}
                name={shelter.name}
                description={shelter.description}
                address={shelter.address}
                phone={shelter.phone}
                website={shelter.website}
                donation_link={shelter.donation_link}
                onViewDetails={() => handleViewDetails(shelter.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-60 bg-muted/30 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium">No shelters found</h3>
              <p className="text-muted-foreground">Try adjusting your search</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Loading fallback
function SheltersPageFallback() {
  return (
    <>
      <Header />
      <div className="mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Find Shelters</h1>
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    </>
  );
}

// Main page component with suspense boundary
export default function SheltersPage() {
  return (
    <Suspense fallback={<SheltersPageFallback />}>
      <SheltersPageContent />
    </Suspense>
  );
}
