import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function DatePicker({
  value,
  onChange,
  placeholder = "Выберите дату",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const selectedDate = value ? parseISO(value) : undefined;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(selectedDate ?? new Date());

  useEffect(() => {
    if (selectedDate) {
      setMonth(selectedDate);
    }
  }, [selectedDate]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 justify-start gap-2 px-3 text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className,
          )}
        >
          <CalendarDays className="size-4" aria-hidden="true" />
          <span>
            {selectedDate ? format(selectedDate, "dd.MM.yyyy") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[292px] gap-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setMonth((current) => subMonths(current, 1))}
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <div className="text-sm font-bold capitalize text-foreground">
            {format(month, "LLLL yyyy")}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            aria-label="Следующий месяц"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div
              key={day}
              className="flex h-8 items-center justify-center text-[11px] font-bold uppercase text-muted-foreground"
            >
              {day}
            </div>
          ))}
          {calendarDays.map((day) => {
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            return (
              <button
                key={day.toISOString()}
                type="button"
                className={cn(
                  "flex h-9 items-center justify-center rounded-md text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground",
                  !isSameMonth(day, month) && "text-muted-foreground/50",
                  isToday(day) && !isSelected && "ring-1 ring-border",
                )}
                onClick={() => {
                  onChange(format(day, "yyyy-MM-dd"));
                  setOpen(false);
                }}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
