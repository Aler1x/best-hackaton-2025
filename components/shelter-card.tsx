"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BuildingIcon, PhoneIcon, GlobeIcon, ExternalLinkIcon, MapPinIcon, MailIcon, HeartIcon } from "lucide-react";

interface ShelterCardProps {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  donationLink?: string;
  onViewDetails?: () => void;
}

export default function ShelterCard({
  id,
  name,
  description,
  address,
  phone,
  website,
  donationLink,
  onViewDetails
}: ShelterCardProps) {
  return (
    <Card className="overflow-hidden border-2 border-border h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <BuildingIcon className="h-5 w-5" />
            {name}
          </CardTitle>
        </div>
        {address && (
          <CardDescription className="flex items-center gap-1">
            <MapPinIcon className="h-3 w-3" />
            {address}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        {description ? (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">No description available</p>
        )}
        
        <div className="grid gap-2">
          {phone && (
            <div className="flex items-center gap-2 text-sm">
              <PhoneIcon className="h-4 w-4" />
              <span>{phone}</span>
            </div>
          )}
          
          {website && (
            <div className="flex items-center gap-2 text-sm">
              <GlobeIcon className="h-4 w-4" />
              <a 
                href={website.startsWith('http') ? website : `https://${website}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Website
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          className="w-full" 
          onClick={onViewDetails}
        >
          View Shelter
        </Button>
      </CardFooter>
    </Card>
  );
} 