"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createQuoteFromEvent } from "@/lib/actions/quotes";
import { Button } from "@/components/ui/button";
import { Loader2Icon, FileTextIcon } from "lucide-react";

interface GenerateQuoteButtonProps {
  eventId: string;
  hasItems: boolean;
}

export function GenerateQuoteButton({
  eventId,
  hasItems,
}: GenerateQuoteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      await createQuoteFromEvent(eventId);
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      size="xs"
      onClick={handleGenerate}
      disabled={isPending || !hasItems}
    >
      {isPending ? (
        <Loader2Icon className="animate-spin" />
      ) : (
        <FileTextIcon />
      )}
      {isPending ? "Generating..." : "Generate Quote"}
    </Button>
  );
}
