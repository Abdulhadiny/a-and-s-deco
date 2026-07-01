"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { FieldError } from "@/components/ui/field-error";
import { profileSchema } from "@/lib/validators";
import { updateProfile } from "@/lib/actions/users";
import { useFormConfirmation } from "@/lib/hooks/use-form-confirmation";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialName: string;
  email: string;
}

export function ProfileForm({ initialName, email }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { showConfirm, setShowConfirm, pendingData, onPreSubmit, resetConfirmation } = useFormConfirmation<ProfileFormValues>();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialName,
      currentPassword: "",
      newPassword: "",
    },
  });

  const onConfirmedSubmit = async () => {
    if (!pendingData) return;
    setIsLoading(true);
    setShowConfirm(false);
    try {
      await updateProfile(pendingData);
      toast.success("Profile updated successfully");
      reset({ name: pendingData.name, currentPassword: "", newPassword: "" });
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
      resetConfirmation();
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground/80 font-semibold">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          disabled
          className="bg-muted border-border text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">Email cannot be changed. Contact an administrator if needed.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-foreground/80 font-semibold">Full Name</Label>
        <Input
          id="name"
          placeholder="Your full name"
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70"
          {...register("name")}
        />
        <FieldError error={errors.name} />
      </div>

      <div className="border-t border-border pt-6 space-y-4">
        <p className="text-sm font-semibold text-foreground/80">Change Password</p>

        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-foreground/80 font-semibold">Current Password</Label>
          <PasswordInput
            id="currentPassword"
            placeholder="••••••••"
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70"
            {...register("currentPassword")}
          />
          <FieldError error={errors.currentPassword} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-foreground/80 font-semibold">New Password</Label>
          <PasswordInput
            id="newPassword"
            placeholder="••••••••"
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70"
            {...register("newPassword")}
          />
          <FieldError error={errors.newPassword} />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full font-bold">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
    <ConfirmationDialog
      open={showConfirm}
      onOpenChange={setShowConfirm}
      onConfirm={onConfirmedSubmit}
      title="Update Profile"
      description="Save changes to your profile?"
      confirmLabel="Yes, Save Changes"
      isLoading={isLoading}
    />
    </>
  );
}
