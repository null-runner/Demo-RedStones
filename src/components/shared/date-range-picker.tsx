"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type DateRangeValue = {
  from: Date;
  to: Date;
};

type Preset = {
  id: string;
  label: string;
  getRange: () => DateRangeValue;
};

function buildPresets(): Preset[] {
  const now = new Date();
  const today = startOfDay(now);

  return [
    {
      id: "today",
      label: "Oggi",
      getRange: () => ({ from: today, to: now }),
    },
    {
      id: "7d",
      label: "Ultimi 7 giorni",
      getRange: () => ({ from: subDays(today, 6), to: now }),
    },
    {
      id: "30d",
      label: "Ultimi 30 giorni",
      getRange: () => ({ from: subDays(today, 29), to: now }),
    },
    {
      id: "90d",
      label: "Ultimi 90 giorni",
      getRange: () => ({ from: subDays(today, 89), to: now }),
    },
    {
      id: "current-month",
      label: "Mese corrente",
      getRange: () => ({ from: startOfMonth(now), to: now }),
    },
    {
      id: "prev-month",
      label: "Mese precedente",
      getRange: () => {
        const prevMonth = subMonths(now, 1);
        return { from: startOfMonth(prevMonth), to: endOfMonth(prevMonth) };
      },
    },
  ];
}

function findActivePreset(value: DateRangeValue, presets: Preset[]): string | null {
  for (const preset of presets) {
    const range = preset.getRange();
    if (isSameDay(range.from, value.from) && isSameDay(range.to, value.to)) {
      return preset.id;
    }
  }
  return null;
}

function formatRangeLabel(value: DateRangeValue): string {
  if (isSameDay(value.from, value.to)) {
    return format(value.from, "d MMM yyyy", { locale: it });
  }
  const sameYear = value.from.getFullYear() === value.to.getFullYear();
  if (sameYear) {
    return `${format(value.from, "d MMM", { locale: it })} – ${format(value.to, "d MMM yyyy", { locale: it })}`;
  }
  return `${format(value.from, "d MMM yyyy", { locale: it })} – ${format(value.to, "d MMM yyyy", { locale: it })}`;
}

type TempRange = { from: Date | undefined; to: Date | undefined };

type DateRangePickerProps = {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  className?: string;
};

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const presets = useMemo(() => buildPresets(), []);
  const activePreset = findActivePreset(value, presets);

  const [tempRange, setTempRange] = useState<TempRange>({ from: value.from, to: value.to });
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [prevValue, setPrevValue] = useState(value);

  if (value.from !== prevValue.from || value.to !== prevValue.to) {
    setPrevValue(value);
    setTempRange({ from: value.from, to: value.to });
    setIsSelecting(false);
  }

  const handlePresetClick = (preset: Preset) => {
    const range = preset.getRange();
    setTempRange({ from: range.from, to: range.to });
    setIsSelecting(false);
    onChange(range);
    setOpen(false);
  };

  // Click logic: click1=start, click2=end (auto-ordered), click3=reset
  const handleDayClick = (day: Date) => {
    if (!tempRange.from || tempRange.to) {
      setTempRange({ from: day, to: undefined });
      setIsSelecting(true);
      return;
    }

    // tempRange.from is set and tempRange.to is undefined — complete the range
    if (tempRange.from.getTime() === day.getTime()) {
      setTempRange({ from: tempRange.from, to: tempRange.from });
    } else {
      const startDate = tempRange.from < day ? tempRange.from : day;
      const endDate = tempRange.from < day ? day : tempRange.from;
      setTempRange({ from: startDate, to: endDate });
    }
    setIsSelecting(false);
  };

  const handleMonthNav = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => (direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)));
  };

  const handleYearChange = (year: string) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setFullYear(parseInt(year));
      return next;
    });
  };

  const handleApply = () => {
    if (tempRange.from) {
      const endDate = tempRange.to ?? tempRange.from;
      onChange({ from: startOfDay(tempRange.from), to: endDate });
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setTempRange({ from: value.from, to: value.to });
    setIsSelecting(false);
    setOpen(false);
  };

  const displayLabel = activePreset
    ? (presets.find((p) => p.id === activePreset)?.label ?? formatRangeLabel(value))
    : formatRangeLabel(value);

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: currentYear - 1990 + 1 }, (_, i) => currentYear - i),
    [currentYear],
  );

  // Build manual range modifiers for visual highlighting
  const rangeModifiers = useMemo(() => {
    const from = tempRange.from;
    const to = tempRange.to;
    if (!from)
      return { rangeStart: [] as Date[], rangeEnd: [] as Date[], rangeMiddle: [] as Date[] };
    if (!to || isSameDay(from, to))
      return { rangeStart: [from], rangeEnd: to ? [to] : [], rangeMiddle: [] as Date[] };

    const days: Date[] = [];
    const startTime = startOfDay(from).getTime() + 86400000;
    const endTime = startOfDay(to).getTime();
    for (let time = startTime; time < endTime; time += 86400000) {
      days.push(new Date(time));
    }
    return { rangeStart: [from], rangeEnd: [to], rangeMiddle: days };
  }, [tempRange.from, tempRange.to]);

  const leftMonth = subMonths(currentMonth, 1);

  const sharedCalendarProps = {
    mode: "single" as const,
    locale: it,
    showOutsideDays: false,
    disabled: { after: new Date() },
    onDayClick: handleDayClick,
    modifiers: rangeModifiers,
    modifiersClassNames: {
      rangeStart: "drp-range-start",
      rangeEnd: "drp-range-end",
      rangeMiddle: "drp-range-middle",
    },
    classNames: {
      months: "flex flex-col",
      month: "space-y-1",
      month_caption: "hidden",
      nav: "hidden",
      month_grid: "w-full border-collapse",
      weekdays: "flex",
      weekday: "text-muted-foreground w-8 font-normal text-[0.8rem] text-center",
      week: "flex w-full mt-1",
      day: "relative p-0 text-center text-sm",
      day_button:
        "h-8 w-8 p-0 font-normal rounded-md transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground",
      selected: "",
      today: "font-bold text-primary",
      outside: "text-muted-foreground opacity-50",
      disabled: "text-muted-foreground opacity-30 pointer-events-none",
      hidden: "invisible",
    },
  } as const;

  return (
    <>
      <style>{`
        td.drp-range-middle {
          background: var(--muted);
        }
        td.drp-range-middle > button {
          font-weight: 500;
          border-radius: 0 !important;
          color: inherit !important;
        }
        td.drp-range-middle > button:hover {
          background: transparent !important;
        }
        td.drp-range-start,
        td.drp-range-end {
          background: var(--foreground) !important;
          border-radius: 9999px !important;
        }
        td.drp-range-start > button,
        td.drp-range-end > button {
          color: var(--background) !important;
          font-weight: 700 !important;
        }
        td.drp-range-start > button:hover,
        td.drp-range-end > button:hover {
          background: transparent !important;
        }
      `}</style>
      <Popover
        open={open}
        onOpenChange={(o) => {
          if (o) {
            setOpen(true);
          } else {
            handleCancel();
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("justify-start gap-2 text-left font-normal", className)}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>{displayLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex">
            {/* Presets sidebar */}
            <div className="flex flex-col gap-1 border-r p-3">
              <p className="text-muted-foreground mb-1 px-2 text-xs font-medium">Periodo</p>
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant={activePreset === preset.id && !isSelecting ? "secondary" : "ghost"}
                  size="sm"
                  className="justify-start text-xs"
                  onClick={() => {
                    handlePresetClick(preset);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Calendar panel */}
            <div className="flex flex-col">
              {/* Year selector (centered) */}
              <div className="flex items-center justify-center px-4 py-1">
                <Select
                  value={currentMonth.getFullYear().toString()}
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger className="h-7 w-auto gap-1 border-none bg-transparent px-2 text-sm font-medium shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px] min-w-[4.5rem]" position="popper">
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month names with nav arrows */}
              <div className="flex items-center px-3 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    handleMonthNav("prev");
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex flex-1 justify-around">
                  <span className="text-sm font-medium capitalize">
                    {format(leftMonth, "MMMM", { locale: it })}
                  </span>
                  <span className="text-sm font-medium capitalize">
                    {format(currentMonth, "MMMM", { locale: it })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleMonthNav("next");
                  }}
                  disabled={currentMonth >= new Date()}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Two calendars side by side */}
              <div className="flex gap-4 px-3">
                <DayPicker month={leftMonth} {...sharedCalendarProps} />
                <DayPicker month={currentMonth} {...sharedCalendarProps} />
              </div>

              {/* Apply / Cancel */}
              <div className="flex items-center justify-end gap-2 border-t px-3 py-2">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  Annulla
                </Button>
                <Button size="sm" onClick={handleApply} disabled={!tempRange.from || isSelecting}>
                  Applica
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
