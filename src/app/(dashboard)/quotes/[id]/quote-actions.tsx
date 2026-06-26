"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuoteStatus } from "@/lib/actions/quotes";
import { QuoteStatus } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import {
  Loader2Icon,
  SendIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";

interface QuoteActionsProps {
  quoteId: string;
  currentStatus: QuoteStatus;
}

export function QuoteActions({ quoteId, currentStatus }: QuoteActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: QuoteStatus) {
    startTransition(async () => {
      await updateQuoteStatus(quoteId, status);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentStatus === "DRAFT" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleStatusChange("SENT")}
        >
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <SendIcon />
          )}
          Mark as Sent
        </Button>
      )}
      {(currentStatus === "DRAFT" || currentStatus === "SENT") && (
        <>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => handleStatusChange("ACCEPTED")}
          >
            {isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <CheckCircleIcon />
            )}
            Mark as Accepted
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => handleStatusChange("DECLINED")}
          >
            {isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <XCircleIcon />
            )}
            Mark as Declined
          </Button>
        </>
      )}
      {currentStatus === "SENT" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleStatusChange("DRAFT")}
        >
          {isPending ? <Loader2Icon className="animate-spin" /> : null}
          Revert to Draft
        </Button>
      )}
    </div>
  );
}
