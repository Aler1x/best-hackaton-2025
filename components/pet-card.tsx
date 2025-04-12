"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeartIcon, ImageIcon } from "lucide-react";
import Image from "next/image";

interface PetCardProps {
  name: string;
  type: string;
  sex: string;
  age: string;
  breed: string;
  description: string;
  imageSrc?: string;
  onFavorite?: () => void;
  onViewDetails?: () => void;
}

export default function PetCard({
  name,
  type,
  sex,
  age,
  breed,
  description,
  imageSrc,
  onFavorite,
  onViewDetails
}: PetCardProps) {
  return (
    <Card className="overflow-hidden border-2 border-border">
      <div className="relative h-60 w-full bg-secondary-background">
        {/* Show image if provided, otherwise show placeholder */}
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`${name} the ${type.toLowerCase()}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <Badge className="absolute top-2 right-2">{type}</Badge>
      </div>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{name}</CardTitle>
          <Button 
            size="icon" 
            variant="neutral" 
            className="h-8 w-8"
            onClick={onFavorite}
            type="button"
          >
            <HeartIcon className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{sex} • {age} • {breed}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2">
          {description}
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={onViewDetails}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
} 