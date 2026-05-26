"use client";

import { useTransition } from "react";
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
          onClick={() => handleTransition("IN_PROGRESS")}
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
          onClick={() => handleTransition("COMPLETED")}
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
        onClick={() => handleTransition("CANCELLED")}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <XCircleIcon />
        )}
        Cancel Event
      </Button>
    </div>
  );
}
