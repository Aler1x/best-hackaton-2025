"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AddButtonProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  disabled?: boolean;
};

export default function AddButton({
  title,
  description,
  children,
  disabled = false,
}: AddButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:bottom-8 md:right-8"
          size="icon"
          disabled={disabled}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add {title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] ">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
} 