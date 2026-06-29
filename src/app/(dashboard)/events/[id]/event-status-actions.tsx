"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateEventStatus } from "@/lib/actions/events";
import { EventStatus } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import {
  Loader2Icon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

interface EventStatusActionsProps {
  eventId: string;
  currentStatus: EventStatus;
}

export function EventStatusActions({
  eventId,
  currentStatus,
}: EventStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<EventStatus | null>(null);
  const showConfirm = pendingStatus !== null;

  function handleTransition(newStatus: EventStatus) {
    startTransition(async () => {
      await updateEventStatus(eventId, newStatus);
      router.refresh();
    });
  }

  if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === "UPCOMING" && (
        <Button
          size="sm"
          onClick={() => setPendingStatus("IN_PROGRESS")}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <PlayIcon />
          )}
          Start Event
        </Button>
      )}

      {currentStatus === "IN_PROGRESS" && (
        <Button
          size="sm"
          onClick={() => setPendingStatus("COMPLETED")}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <CheckCircleIcon />
          )}
          Complete Event
        </Button>
      )}

      {/* Cancel is available from UPCOMING or IN_PROGRESS */}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setPendingStatus("CANCELLED")}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <XCircleIcon />
        )}
        Cancel Event
      </Button>
      <ConfirmationDialog
        open={showConfirm}
        onOpenChange={(open) => { if (!open) setPendingStatus(null); }}
        onConfirm={() => { if (pendingStatus) handleTransition(pendingStatus); setPendingStatus(null); }}
        title={
          pendingStatus === "CANCELLED"
            ? "Cancel Event"
            : pendingStatus === "COMPLETED"
            ? "Complete Event"
            : "Start Event"
        }
        description={
          pendingStatus === "CANCELLED"
            ? "This event will be cancelled. This action cannot be reversed."
            : pendingStatus === "COMPLETED"
            ? "Mark this event as completed?"
            : "Start this event? Items will be marked as allocated."
        }
        confirmLabel={
          pendingStatus === "CANCELLED"
            ? "Yes, Cancel Event"
            : pendingStatus === "COMPLETED"
            ? "Yes, Complete Event"
            : "Yes, Start Event"
        }
        variant={pendingStatus === "CANCELLED" ? "destructive" : "default"}
        isLoading={isPending}
      />
    </div>
  );
}
