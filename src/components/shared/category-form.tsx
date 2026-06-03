"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import { categorySchema } from "@/lib/validators";
import { createCategory, updateCategory } from "@/lib/actions/inventory";

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || "",
        }
      : {
          name: "",
          description: "",
        },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    setIsLoading(true);
    try {
      if (initialData) {
        await updateCategory(initialData.id, data);
        toast.success("Category updated");
      } else {
        await createCategory(data);
        toast.success("Category created");
        reset();
      }
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-foreground/80 font-semibold text-xs uppercase">Category Name</Label>
        <Input 
          id="name" 
          placeholder="e.g. Chairs, Lighting" 
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70 h-9"
          {...register("name")} 
        />
        <FieldError error={errors.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground/80 font-semibold text-xs uppercase">Description (Optional)</Label>
        <Textarea 
          id="description" 
          placeholder="Short description..." 
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70 min-h-[80px] resize-none"
          {...register("description")} 
        />
        <FieldError error={errors.description} />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full font-bold h-9">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initialData ? "Update Category" : "Create Category"}
      </Button>
    </form>
  );
}
