"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image, PlusCircle, Trash } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface PetFormProps {
  onSubmit: (data: any) => Promise<boolean>;
  shelter_id: string | null;
  initialData?: any;
  isEdit?: boolean;
}

export default function PetForm({ 
  onSubmit, 
  shelter_id, 
  initialData = null, 
  isEdit = false 
}: PetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const form = useForm({
    defaultValues: initialData || {
      name: "",
      type: "",
      sex: "",
      age: 0,
      description: "",
      health: "",
      status: "waiting",
      images: [],
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Get the selected files and add them to the state
    const newFiles = Array.from(e.target.files);
    
    // Check file types
    const validFiles = newFiles.filter(file => 
      file.type === "image/jpeg" || 
      file.type === "image/png" || 
      file.type === "image/webp"
    );
    
    if (validFiles.length !== newFiles.length) {
      toast.error("Some files were not added", {
        description: "Only JPEG, PNG, and WebP images are supported"
      });
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // Add shelter ID to data
      if (shelter_id && !isEdit) {
        data.shelter_id = shelter_id;
      }
      
      // Upload images if any
      let imageUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        
        const supabase = createClient();
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `pets/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file);
          
          if (uploadError) {
            throw uploadError;
          }
          
          // Get public URL for the uploaded image
          const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);
            
          imageUrls.push(urlData.publicUrl);
          
          // Update progress
          setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
        }
        
        setIsUploading(false);
      }
      
      // Combine existing images with new images
      if (imageUrls.length > 0) {
        data.images = [...(data.images || []), ...imageUrls];
      }
      
      const success = await onSubmit(data);
      
      if (success) {
        form.reset();
        setSelectedFiles([]);
      }
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
      return false;
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pet type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cat">Cat</SelectItem>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="rabbit">Rabbit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sex *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pet sex" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age (years) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about this pet"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="health"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Health Information</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Health condition, vaccinations, etc."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pet status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="in_shelter">In Shelter</SelectItem>
                  {isEdit && <SelectItem value="adopted">Adopted</SelectItem>}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label htmlFor="images">Images (Optional)</Label>
          <div className="border rounded-md p-4">
            {selectedFiles.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative h-20 w-20 rounded-md bg-muted overflow-hidden">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Selected ${index}`} 
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center"
                        onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {selectedFiles.length < 5 && (
                    <label className="flex items-center justify-center h-20 w-20 rounded-md border-2 border-dashed cursor-pointer">
                      <PlusCircle className="h-8 w-8 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedFiles.length}/5 images selected
                </p>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-6 cursor-pointer">
                <Image className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium mb-1">Add photos of the pet</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload up to 5 images (JPEG, PNG, WebP)
                </p>
                <Button type="button" variant="neutral" size="sm">
                  Select Images
                </Button>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        </div>
        
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Update Pet" : "Add Pet"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 