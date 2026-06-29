"use client";

import { useTransition, useState } from "react";
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
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

interface QuoteActionsProps {
  quoteId: string;
  currentStatus: QuoteStatus;
}

export function QuoteActions({ quoteId, currentStatus }: QuoteActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<QuoteStatus | null>(null);

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
          onClick={() => setPendingStatus("SENT")}
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
            onClick={() => setPendingStatus("ACCEPTED")}
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
            onClick={() => setPendingStatus("DECLINED")}
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
          onClick={() => setPendingStatus("DRAFT")}
        >
          {isPending ? <Loader2Icon className="animate-spin" /> : null}
          Revert to Draft
        </Button>
      )}
      <ConfirmationDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => { if (!open) setPendingStatus(null); }}
        onConfirm={() => { if (pendingStatus) handleStatusChange(pendingStatus); setPendingStatus(null); }}
        title={
          pendingStatus === "SENT"
            ? "Mark as Sent"
            : pendingStatus === "ACCEPTED"
            ? "Mark as Accepted"
            : pendingStatus === "DECLINED"
            ? "Mark as Declined"
            : "Revert to Draft"
        }
        description={
          pendingStatus === "SENT"
            ? "Mark this quote as sent to the customer?"
            : pendingStatus === "ACCEPTED"
            ? "Mark this quote as accepted?"
            : pendingStatus === "DECLINED"
            ? "Mark this quote as declined? This is a destructive action."
            : "Revert this quote back to draft status?"
        }
        confirmLabel={
          pendingStatus === "SENT"
            ? "Yes, Mark as Sent"
            : pendingStatus === "ACCEPTED"
            ? "Yes, Mark as Accepted"
            : pendingStatus === "DECLINED"
            ? "Yes, Mark as Declined"
            : "Yes, Revert"
        }
        variant={pendingStatus === "DECLINED" ? "destructive" : "default"}
        isLoading={isPending}
      />
    </div>
  );
}
