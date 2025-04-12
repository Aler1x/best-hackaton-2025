"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  PawPrint, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Info,
  Calendar,
  Heart,
  Edit,
  Trash,
  Pencil
} from "lucide-react";
import Link from "next/link";

type Pet = {
  id: number;
  name: string;
  sex: string;
  age: number;
  type: string;
  status: string;
  description: string | null;
  health: string | null;
  location: { lat: number; lng: number; } | null;
  shelterId: string;
  createdAt: string;
  updatedAt: string;
  images: string[];
};

export default function PetsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  
  // Selected pet for detail view
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
        router.push("/auth/signin?next=/account/pets");
          return;
        }

        setUserId(user.id);

      // Check if user is a shelter
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (userError || userData?.role !== "shelter") {
        toast.error("Access denied", {
          description: "Only shelters can access this page"
        });
        router.push("/account");
      return;
      }
      
      // Fetch pets for this shelter
      await fetchPets(user.id);
      
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPets = async (shelterId: string) => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("shelterId", shelterId);
      
      if (error) {
        throw error;
      }
      
      setPets(data || []);
    } catch (error) {
      console.error("Error fetching pets:", error);
      toast.error("Failed to load pets");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Waiting</Badge>;
      case "in_shelter":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Shelter</Badge>;
      case "adopted":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Adopted</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const handleOpenDetail = (pet: Pet) => {
    setSelectedPet(pet);
    setIsDetailOpen(true);
  };

  // Filtering and sorting logic
  const filteredAndSortedPets = () => {
    // First apply filters
    let filtered = pets;
    
    // Filter by search query (name or description)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pet => 
        pet.name.toLowerCase().includes(query) || 
        (pet.description && pet.description.toLowerCase().includes(query))
      );
    }
    
    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(pet => pet.status === filterStatus);
    }
    
    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(pet => pet.type === filterType);
    }
    
    // Apply sorting
    const [field, direction] = sortBy.split('-');
    
    return filtered.sort((a, b) => {
      // Handle different sort fields
      switch (field) {
        case "name":
          return direction === 'asc' 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name);
        case "age":
          return direction === 'asc' 
            ? a.age - b.age 
            : b.age - a.age;
        case "date":
          return direction === 'asc' 
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() 
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading pets...</p>
              </div>
  );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Pets</h1>
          <p className="text-muted-foreground">
            Manage the pets available for adoption at your shelter
          </p>
        </div>
        <Link href="/account/pets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Pet
          </Button>
        </Link>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pets..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="w-full sm:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <span>Status</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="in_shelter">In Shelter</SelectItem>
                <SelectItem value="adopted">Adopted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-auto">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <PawPrint className="h-4 w-4 mr-2" />
                <span>Type</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cat">Cats</SelectItem>
                <SelectItem value="dog">Dogs</SelectItem>
                <SelectItem value="rabbit">Rabbits</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <span>Sort By</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="age-asc">Age (Low-High)</SelectItem>
                <SelectItem value="age-desc">Age (High-Low)</SelectItem>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pets grid */}
      {pets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PawPrint className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">No pets yet</h3>
            <p className="text-muted-foreground mb-6">
              Add pets to your shelter to help them find a new home
            </p>
            <Link href="/account/pets/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Pet
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredAndSortedPets().length === 0 ? (
      <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">No pets match your filters</h3>
            <p className="text-muted-foreground mb-6">
              Try changing your search or filter criteria
            </p>
            <Button variant="neutral" onClick={() => {
              setSearchQuery("");
              setFilterStatus("all");
              setFilterType("all");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedPets().map((pet) => (
            <Card 
              key={pet.id} 
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleOpenDetail(pet)}
            >
              <div className="relative h-48 bg-muted">
                {pet.images && pet.images.length > 0 ? (
                  <img 
                    src={pet.images[0]} 
                    alt={pet.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <PawPrint className="h-12 w-12 text-muted-foreground opacity-30" />
            </div>
          )}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(pet.status)}
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      {pet.name} {pet.sex}
                    </CardTitle>
                    <CardDescription className="capitalize">
                      {pet.type}, {pet.age} {pet.age === 1 ? 'year' : 'years'} old
                    </CardDescription>
                  </div>
                  <Button 
                    size="icon" 
                    variant="neutral" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/account/pets/${pet.id}/edit`);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm line-clamp-2 text-muted-foreground">
                  {pet.description || "No description provided."}
                </p>
        </CardContent>
      </Card>
          ))}
        </div>
      )}

      {/* Pet detail modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        {selectedPet && (
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                {selectedPet.name} {selectedPet.sex}
                <span className="ml-auto">{getStatusBadge(selectedPet.status)}</span>
              </DialogTitle>
              <DialogDescription className="text-base capitalize">
                {selectedPet.type}, {selectedPet.age} {selectedPet.age === 1 ? 'year' : 'years'} old
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Pet images */}
              {selectedPet.images && selectedPet.images.length > 0 ? (
                <div className="relative h-64 rounded-md overflow-hidden">
                  <img 
                    src={selectedPet.images[0]} 
                    alt={selectedPet.name}
                    className="h-full w-full object-cover"
                  />
                  {selectedPet.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      +{selectedPet.images.length - 1} more photos
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-64 bg-muted rounded-md flex items-center justify-center">
                  <PawPrint className="h-12 w-12 text-muted-foreground opacity-30" />
                </div>
              )}

              {/* Pet details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="font-medium flex items-center">
                    <PawPrint className="h-4 w-4 mr-2 text-muted-foreground" />
                    Type
                  </p>
                  <p className="capitalize pl-6">{selectedPet.type}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    Age
                  </p>
                  <p className="pl-6">{selectedPet.age} {selectedPet.age === 1 ? 'year' : 'years'}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-muted-foreground" />
                    Health
                  </p>
                  <p className="pl-6">{selectedPet.health || "No health info provided"}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium flex items-center">
                    <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                    Listed On
                  </p>
                  <p className="pl-6">{formatDate(selectedPet.createdAt)}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <p className="font-medium">Description</p>
                <p className="text-sm whitespace-pre-line">
                  {selectedPet.description || "No description provided."}
                </p>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button 
                variant="neutral"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDetailOpen(false);
                  // Navigate to delete confirmation
                }}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
              
              <Link href={`/account/pets/${selectedPet.id}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Pet
                </Button>
              </Link>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
} 