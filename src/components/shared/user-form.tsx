"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userSchema } from "@/lib/validators";
import { createUser, updateUser } from "@/lib/actions/users";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { useFormConfirmation } from "@/lib/hooks/use-form-confirmation";

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: {
    id: string;
    email: string;
    name: string;
    roleId: string | null;
    locationId: string | null;
    isActive: boolean;
  };
  roles: { id: string; displayName: string }[];
  locations: { id: string; name: string }[];
}

export function UserForm({ initialData, roles, locations }: UserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { showConfirm, setShowConfirm, pendingData, onPreSubmit, resetConfirmation } = useFormConfirmation<UserFormValues>();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData
      ? {
          email: initialData.email,
          name: initialData.name,
          password: "",
          roleId: initialData.roleId || "",
          locationId: initialData.locationId,
          isActive: initialData.isActive,
        }
      : {
          email: "",
          name: "",
          password: "",
          roleId: "",
          locationId: null,
          isActive: true,
        },
  });

  const onConfirmedSubmit = async () => {
    if (!pendingData) return;
    setIsLoading(true);
    setShowConfirm(false);
    try {
      if (initialData) {
        await updateUser(initialData.id, pendingData);
        toast.success("User updated successfully");
      } else {
        await createUser(pendingData);
        toast.success("User created successfully");
      }
      router.push("/settings/users");
      router.refresh();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
      resetConfirmation();
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground/80 font-semibold">Full Name</Label>
          <Input 
            id="name" 
            placeholder="John Doe" 
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70"
            {...register("name")} 
          />
          <FieldError error={errors.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground/80 font-semibold">Email Address</Label>
          <Input 
            id="email" 
            type="email"
            placeholder="john@asdeco.com" 
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70"
            {...register("email")} 
          />
          <FieldError error={errors.email} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" title={initialData ? "Leave blank to keep current password" : ""}>
            <span className="text-foreground/80 font-semibold">{initialData ? "New Password (optional)" : "Password"}</span>
          </Label>
          <Input 
            id="password" 
            type="password"
            placeholder="••••••••" 
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70"
            {...register("password")} 
          />
          <FieldError error={errors.password} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-foreground/80 font-semibold">Role</Label>
            <Controller
              control={control}
              name="roleId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>{role.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError error={errors.roleId} />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground/80 font-semibold">Primary Location</Label>
            <Controller
              control={control}
              name="locationId"
              render={({ field }) => (
                 <Select value={field.value || "null"} onValueChange={(v) => field.onChange(v === "null" || !v ? null : v)}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder="Global (All locations)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="null">Global (All locations)</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError error={errors.locationId} />
          </div>
        </div>

        <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border border-border">
          <input 
            type="checkbox" 
            id="isActive" 
            {...register("isActive")} 
            className="h-4 w-4 rounded border-border bg-muted text-primary focus:ring-primary focus:ring-offset-background" 
          />
          <Label htmlFor="isActive" className="text-sm font-medium text-muted-foreground cursor-pointer">Active account (allows login)</Label>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1 font-bold">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update User" : "Create User"}
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
        title={initialData ? "Update User" : "Create User"}
        description={`Are you sure you want to ${initialData ? "update" : "create"} this user?`}
        confirmLabel={initialData ? "Yes, Update" : "Yes, Create"}
        isLoading={isLoading}
      />
    </>
  );
}
