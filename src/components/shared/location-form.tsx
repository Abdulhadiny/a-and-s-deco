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
import { filterName } from "@/lib/input-filters";
import { locationSchema } from "@/lib/validators";
import { createLocation, updateLocation } from "@/lib/actions/settings";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { useFormConfirmation } from "@/lib/hooks/use-form-confirmation";

type LocationFormValues = z.infer<typeof locationSchema>;

interface LocationFormProps {
  initialData?: any;
}

export function LocationForm({ initialData }: LocationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { showConfirm, setShowConfirm, pendingData, onPreSubmit, resetConfirmation } = useFormConfirmation<LocationFormValues>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          address: initialData.address || "",
          isActive: initialData.isActive,
        }
      : {
          name: "",
          address: "",
          isActive: true,
        },
  });

  const onConfirmedSubmit = async () => {
    if (!pendingData) return;
    setIsLoading(true);
    setShowConfirm(false);
    try {
      if (initialData) {
        await updateLocation(initialData.id, pendingData);
        toast.success("Location updated successfully");
      } else {
        await createLocation(pendingData);
        toast.success("Location created successfully");
      }
      router.push("/settings/locations");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
      resetConfirmation();
    }
  };

  const { onChange: onNameChange, ...nameReg } = register("name");

  return (
    <>
      <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground/80 font-semibold">Location Name</Label>
          <Input
            id="name"
            placeholder="e.g. Main Warehouse"
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50"
            {...nameReg}
            onChange={(e) => { e.target.value = filterName(e.target.value); return onNameChange(e); }}
          />
          <FieldError error={errors.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-foreground/80 font-semibold">Address</Label>
          <Textarea 
            id="address" 
            placeholder="Detailed address or directions..." 
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 min-h-[100px]"
            {...register("address")} 
          />
          <FieldError error={errors.address} />
        </div>

        <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border border-border">
          <input 
            type="checkbox" 
            id="isActive" 
            {...register("isActive")} 
            className="h-4 w-4 rounded border-border bg-muted text-primary focus:ring-primary focus:ring-offset-background" 
          />
          <Label htmlFor="isActive" className="text-sm font-medium text-muted-foreground cursor-pointer">This location is active and available for use</Label>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1 font-bold">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Location" : "Create Location"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="border-border text-muted-foreground hover:text-foreground font-semibold">
            Cancel
          </Button>
        </div>
      </form>

      <ConfirmationDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={onConfirmedSubmit}
        title={initialData ? "Update Location" : "Create Location"}
        description={`Are you sure you want to ${initialData ? "update" : "create"} this location?`}
        confirmLabel={initialData ? "Yes, Update" : "Yes, Create"}
        isLoading={isLoading}
      />
    </>
  );
}
