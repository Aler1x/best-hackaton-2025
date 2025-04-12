"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Hourglass,
  PawPrint
} from "lucide-react";
import Link from "next/link";

type Pet = {
  id: number;
  name: string;
  type: string;
  images: string[];
};

type Volunteer = {
  id: string;
  bio: string | null;
  phone: string | null;
  email?: string; // Added from auth.users
};

type AdoptionRequest = {
  id: number;
  volunteerId: string;
  petId: number;
  status: string;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined data
  pets: Pet;
  volunteers: Volunteer;
};

export default function AdoptionRequestsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [activeTab, setActiveTab] = useState("all");

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
        router.push("/auth/signin?next=/account/adoption-requests");
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
      
      // Fetch adoption requests for this shelter
      await fetchAdoptionRequests(user.id);
      
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdoptionRequests = async (shelterId: string) => {
    try {
      const supabase = createClient();
      
      // Get all pets for this shelter
      const { data: pets, error: petsError } = await supabase
        .from("pets")
        .select("id")
        .eq("shelterId", shelterId);
      
      if (petsError) {
        throw petsError;
      }
      
      if (!pets || pets.length === 0) {
        setRequests([]);
        return;
      }
      
      const petIds = pets.map(pet => pet.id);
      
      // Get all adoption requests for these pets with joined data
      const { data, error } = await supabase
        .from("adoption_requests")
        .select(`
          *,
          pets:petId (
            id,
            name,
            type,
            images
          ),
          volunteers:volunteerId (
            id,
            bio,
            phone
          )
        `)
        .in("petId", petIds)
        .order("createdAt", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Fetch volunteer emails from auth.users
      const volunteerIds = data.map(request => request.volunteerId);
      const { data: users, error: usersError } = await supabase
        .from("users") // This joins your users table, not auth.users
        .select("id")
        .in("id", volunteerIds);
      
      if (usersError) {
        console.error("Error fetching user emails:", usersError);
      }
      
      // Temporary solution until we can get emails
      // In a real app, you'd need to join with auth.users through admin APIs or cache emails
      const processedRequests = data.map(request => {
        // Add an email property for display purposes
        const volunteer = {
          ...request.volunteers,
          email: `${request.volunteerId.substring(0, 6)}...@example.com`, // Placeholder
        };
        
        return {
          ...request,
          volunteers: volunteer
        };
      });
      
      setRequests(processedRequests || []);
    } catch (error) {
      console.error("Error fetching adoption requests:", error);
      toast.error("Failed to load adoption requests");
    }
  };

  const updateRequestStatus = async (requestId: number, newStatus: string) => {
    if (!userId) return;
    
    try {
      setIsProcessing(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from("adoption_requests")
        .update({
          status: newStatus,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", requestId);
      
      if (error) throw error;
      
      // Update local state
      setRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status: newStatus, updatedAt: new Date().toISOString() } 
            : request
        )
      );
      
      toast.success(`Request ${newStatus === 'approved' ? 'approved' : 'rejected'}`, {
        description: newStatus === 'approved' 
          ? 'The adopter will be notified about your decision' 
          : 'The adopter will be notified that their request was declined'
      });
      
    } catch (error: any) {
      console.error("Error updating request status:", error);
      toast.error("Failed to update request", {
        description: error.message || "Please try again"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = activeTab === "all" 
    ? requests 
    : requests.filter(request => request.status === activeTab);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading adoption requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Adoption Requests</h1>
        <p className="text-muted-foreground">
          Manage requests from potential adopters for your pets
        </p>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No adoption requests yet</h3>
                <p className="text-muted-foreground mb-6">
                  When someone wants to adopt one of your pets, their request will appear here
                </p>
                <Link href="/account/pets">
                  <Button>
                    Manage Your Pets
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Hourglass className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No {activeTab} requests</h3>
                <p className="text-muted-foreground mb-6">
                  There are no adoption requests with status "{activeTab}" at the moment
                </p>
                <Button onClick={() => setActiveTab("all")}>
                  View All Requests
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                      <div className="flex items-center gap-3">
                        {/* Pet image if available */}
                        {request.pets.images && request.pets.images.length > 0 ? (
                          <div className="h-12 w-12 rounded-full overflow-hidden">
                            <img 
                              src={request.pets.images[0]} 
                              alt={request.pets.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <PawPrint className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">
                            Request for {request.pets.name}
                          </CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(request.createdAt)}
                            <Clock className="h-3 w-3 ml-2 mr-1" />
                            {formatTime(request.createdAt)}
                          </CardDescription>
                        </div>
                      </div>
                      <div>
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-md bg-muted/50">
                        <div className="mb-2 flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium">From {request.volunteers.email}</span>
                        </div>
                        {request.volunteers.phone && (
                          <div className="mb-2 flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm">{request.volunteers.phone}</span>
                          </div>
                        )}
                        <div className="mt-2">
                          <div className="text-sm font-medium mb-1">Message:</div>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {request.message || "No message provided."}
                          </p>
                        </div>
                        {request.volunteers.bio && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-sm font-medium mb-1">About the adopter:</div>
                            <p className="text-sm text-muted-foreground">
                              {request.volunteers.bio}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  {request.status === "pending" && (
                    <CardFooter className="flex justify-end gap-2">
                      <Button
                        variant="neutral"
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => updateRequestStatus(request.id, "rejected")}
                        disabled={isProcessing}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                      <Button
                        variant="neutral"
                        size="sm"
                        className="border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => updateRequestStatus(request.id, "approved")}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 