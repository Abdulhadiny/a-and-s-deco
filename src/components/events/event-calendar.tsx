"use client";

import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  eventDate: string | Date;
  eventType: string;
  status: string;
  customer: { id: string; name: string } | null;
}

interface EventCalendarProps {
  events: CalendarEvent[];
  initialYear: number;
  initialMonth: number;
  onMonthChange?: (year: number, month: number) => void;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  WEDDING: "bg-pink-500",
  NAMING: "bg-blue-500",
  BIRTHDAY: "bg-orange-500",
  GRADUATION: "bg-emerald-500",
  OTHER: "bg-gray-400",
};

const EVENT_TYPE_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  WEDDING: "default",
  NAMING: "default",
  BIRTHDAY: "default",
  GRADUATION: "default",
  OTHER: "secondary",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: "Wedding",
  NAMING: "Naming",
  BIRTHDAY: "Birthday",
  GRADUATION: "Graduation",
  OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Upcoming",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function EventCalendar({
  events,
  initialYear,
  initialMonth,
  onMonthChange,
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(
    new Date(initialYear, initialMonth, 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Build a map of date -> events for fast lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const dateKey = format(new Date(event.eventDate), "yyyy-MM-dd");
      const existing = map.get(dateKey) ?? [];
      existing.push(event);
      map.set(dateKey, existing);
    }
    return map;
  }, [events]);

  // Build grid of weeks
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const weeks: Date[][] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const weekDayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedDateEvents = selectedDate
    ? eventsByDate.get(format(selectedDate, "yyyy-MM-dd")) ?? []
    : [];

  function handlePrevMonth() {
    const prev = subMonths(currentDate, 1);
    setCurrentDate(prev);
    setSelectedDate(null);
    onMonthChange?.(prev.getFullYear(), prev.getMonth());
  }

  function handleNextMonth() {
    const next = addMonths(currentDate, 1);
    setCurrentDate(next);
    setSelectedDate(null);
    onMonthChange?.(next.getFullYear(), next.getMonth());
  }

  function handleDateClick(date: Date) {
    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDaysIcon className="size-4" />
            {format(currentDate, "MMMM yyyy")}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px">
          {/* Weekday headers */}
          {weekDayHeaders.map((dayName) => (
            <div
              key={dayName}
              className="py-1.5 text-center text-xs font-medium text-muted-foreground"
            >
              {dayName}
            </div>
          ))}

          {/* Date cells */}
          {weeks.map((week, wi) =>
            week.map((date, di) => {
              const dateKey = format(date, "yyyy-MM-dd");
              const dayEvents = eventsByDate.get(dateKey) ?? [];
              const inMonth = isSameMonth(date, currentDate);
              const today = isToday(date);
              const selected = selectedDate ? isSameDay(date, selectedDate) : false;

              return (
                <button
                  key={`${wi}-${di}`}
                  type="button"
                  onClick={() => handleDateClick(date)}
                  className={[
                    "relative flex min-h-12 flex-col items-center gap-0.5 rounded-md p-1 text-sm transition-colors sm:min-h-16",
                    inMonth
                      ? "text-foreground hover:bg-muted"
                      : "text-muted-foreground/40 hover:bg-muted/50",
                    today && "bg-muted font-semibold",
                    selected && "ring-2 ring-primary bg-primary/5",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="text-xs leading-none sm:text-sm">
                    {format(date, "d")}
                  </span>
                  {/* Event dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={`block size-1.5 rounded-full ${EVENT_TYPE_COLORS[ev.eventType] ?? "bg-gray-400"}`}
                          title={ev.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] leading-none text-muted-foreground">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Selected date events panel */}
        {selectedDate && (
          <div className="mt-4 border-t pt-4">
            <p className="mb-2 text-sm font-medium">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </p>
            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No events on this date.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedDateEvents.map((ev) => (
                  <a
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    className="flex items-center justify-between rounded-lg border p-2.5 transition-colors hover:bg-muted"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{ev.title}</span>
                      {ev.customer && (
                        <span className="text-xs text-muted-foreground">
                          {ev.customer.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={EVENT_TYPE_BADGE_VARIANT[ev.eventType] ?? "secondary"}
                        className={
                          ev.eventType === "WEDDING"
                            ? "bg-pink-500/10 text-pink-700 dark:text-pink-400"
                            : ev.eventType === "NAMING"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                              : ev.eventType === "BIRTHDAY"
                                ? "bg-orange-500/10 text-orange-700 dark:text-orange-400"
                                : ev.eventType === "GRADUATION"
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  : ""
                        }
                      >
                        {EVENT_TYPE_LABELS[ev.eventType] ?? ev.eventType}
                      </Badge>
                      <Badge
                        variant={
                          ev.status === "UPCOMING"
                            ? "outline"
                            : ev.status === "COMPLETED"
                              ? "default"
                              : ev.status === "CANCELLED"
                                ? "destructive"
                                : "secondary"
                        }
                      >
                        {STATUS_LABELS[ev.status] ?? ev.status}
                      </Badge>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
