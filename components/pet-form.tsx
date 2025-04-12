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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PetFormProps {
  onSubmit: (data: any) => Promise<boolean>;
  shelterId: string | null;
  initialData?: any;
  isEdit?: boolean;
}

export default function PetForm({ 
  onSubmit, 
  shelterId, 
  initialData = null, 
  isEdit = false 
}: PetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    // Add shelter ID to data
    if (shelterId && !isEdit) {
      data.shelterId = shelterId;
    }
    
    const success = await onSubmit(data);
    
    if (success) {
      form.reset();
    }
    
    setIsSubmitting(false);
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

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Update Pet" : "Add Pet"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 