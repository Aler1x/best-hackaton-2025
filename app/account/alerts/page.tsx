"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Bell } from "lucide-react";
import { toast } from "sonner";
import AddButton from "@/components/add-button";

interface PetAlert {
  id: number;
  petType: string;
  location: {
    lat: number;
    lng: number;
    radius: number;
  };
  active: boolean;
  created_at: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<PetAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Check if user is logged in
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/auth/signin");
          return;
        }

        // Fetch user's alerts
        // In a real app this would be an API call
        // For now we'll use mock data
        setTimeout(() => {
          setAlerts([
            {
              id: 1,
              petType: "dog",
              location: {
                lat: 40.7128,
                lng: -74.006,
                radius: 10,
              },
              active: true,
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              petType: "cat",
              location: {
                lat: 40.7128,
                lng: -74.006,
                radius: 5,
              },
              active: false,
              created_at: new Date().toISOString(),
            },
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching alerts:", error);
        toast.error("Failed to load your alerts");
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, [router]);

  const handleToggleAlert = async (id: number, currentStatus: boolean) => {
    try {
      // In a real app this would be an API call
      // For now we'll just update the local state
      setAlerts(
        alerts.map((alert) =>
          alert.id === id ? { ...alert, active: !currentStatus } : alert
        )
      );
      
      toast.success(`Alert ${currentStatus ? "disabled" : "enabled"}`);
    } catch (error) {
      console.error("Error toggling alert:", error);
      toast.error("Failed to update alert");
    }
  };

  const handleDeleteAlert = async (id: number) => {
    if (!confirm("Are you sure you want to delete this alert?")) {
      return;
    }

    try {
      // In a real app this would be an API call
      setAlerts(alerts.filter((alert) => alert.id !== id));
      toast.success("Alert deleted");
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast.error("Failed to delete alert");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLocation = (location: { lat: number; lng: number; radius: number }) => {
    return `Within ${location.radius} miles`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pet Alerts</h1>
        <p className="text-muted-foreground">
          Get notified when new pets matching your criteria become available
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <p>Loading alerts...</p>
            </div>
          ) : alerts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Badge>
                        {alert.petType.charAt(0).toUpperCase() + alert.petType.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatLocation(alert.location)}</TableCell>
                    <TableCell>{formatDate(alert.created_at)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={alert.active}
                        onCheckedChange={() =>
                          handleToggleAlert(alert.id, alert.active)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="neutral"
                          size="icon"
                          onClick={() => {/* Edit alert */}}
                        >
                          <span className="sr-only">Edit</span>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteAlert(alert.id)}
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
          ) : (
            <div className="flex flex-col items-center justify-center h-60">
              <p className="text-muted-foreground mb-2">You don't have any alerts yet.</p>
              <p className="text-sm text-muted-foreground">
                Create an alert to get notified when new pets are added.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddButton
        title="Create Alert"
        description="Set up notifications for new pets matching your criteria."
      >
        <div className="p-4 text-center text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Alert creation form will be implemented soon.</p>
        </div>
      </AddButton>
    </div>
  );
} 