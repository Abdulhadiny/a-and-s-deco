"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deallocateItem } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import { Loader2Icon, XIcon } from "lucide-react";

interface DeallocateButtonProps {
  eventId: string;
  itemId: string;
}

export function DeallocateButton({ eventId, itemId }: DeallocateButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      await deallocateItem(eventId, itemId);
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handleRemove}
      disabled={isPending}
      aria-label="Remove item"
    >
      {isPending ? (
        <Loader2Icon className="animate-spin" />
      ) : (
        <XIcon />
      )}
    </Button>
  );
}
