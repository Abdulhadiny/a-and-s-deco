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
import { FieldError } from "@/components/ui/field-error";
import { expenseCategorySchema } from "@/lib/validators";
import { createExpenseCategory, updateExpenseCategory } from "@/lib/actions/finance";

type ExpenseCategoryFormValues = z.infer<typeof expenseCategorySchema>;

interface ExpenseCategoryFormProps {
  initialData?: {
    id: string;
    name: string;
    isActive: boolean;
  };
  onSuccess?: () => void;
}

export function ExpenseCategoryForm({ initialData, onSuccess }: ExpenseCategoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExpenseCategoryFormValues>({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          isActive: initialData.isActive,
        }
      : {
          name: "",
          isActive: true,
        },
  });

  const onSubmit = async (data: ExpenseCategoryFormValues) => {
    setIsLoading(true);
    try {
      if (initialData) {
        await updateExpenseCategory(initialData.id, data);
        toast.success("Expense category updated");
      } else {
        await createExpenseCategory(data);
        toast.success("Expense category created");
        reset();
      }
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "An error occurred");
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
          placeholder="e.g. Fuel, Transport, Labor" 
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70 h-9"
          {...register("name")} 
        />
        <FieldError error={errors.name} />
      </div>

      {initialData && (
        <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border border-border">
          <input 
            type="checkbox" 
            id="isActive" 
            {...register("isActive")} 
            className="h-4 w-4 rounded border-border bg-muted text-primary focus:ring-primary focus:ring-offset-background" 
          />
          <Label htmlFor="isActive" className="text-sm font-medium text-muted-foreground cursor-pointer">Active category (allows selection)</Label>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full font-bold h-9">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initialData ? "Update Category" : "Create Category"}
      </Button>
    </form>
  );
}
