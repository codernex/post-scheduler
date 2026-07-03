"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DateTimePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

// Scrollable time column with auto-scroll to selected value
function TimeColumn({
  items,
  selected,
  onSelect,
  pad = 2,
}: {
  items: number[]
  selected: number
  onSelect: (val: number) => void
  pad?: number
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Scroll to the selected item on mount and when selected changes
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const selectedEl = container.querySelector(`[data-value="${selected}"]`) as HTMLElement
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "center", behavior: "smooth" })
    }
  }, [selected])

  return (
    <div
      ref={containerRef}
      className="h-[200px] overflow-y-auto scrollbar-thin flex flex-col gap-0.5 px-1 py-1 snap-y snap-mandatory"
    >
      {items.map((val) => (
        <button
          key={val}
          data-value={val}
          type="button"
          onClick={() => onSelect(val)}
          className={cn(
            "w-10 h-8 flex items-center justify-center rounded-md text-sm font-mono transition-all snap-center shrink-0 cursor-pointer",
            selected === val
              ? "bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-500/30"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          )}
        >
          {val.toString().padStart(pad, "0")}
        </button>
      ))}
    </div>
  )
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date & time",
  className,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const dateValue = value ? value : undefined
  const hours = value ? value.getHours() : 12
  const minutes = value ? value.getMinutes() : 0

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange(undefined)
      return
    }

    const newDate = new Date(selectedDate)
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    newDate.setSeconds(0)
    newDate.setMilliseconds(0)
    onChange(newDate)
  }

  const handleTimeChange = (type: "hours" | "minutes", val: number) => {
    const baseDate = value ? new Date(value) : new Date()
    if (type === "hours") {
      baseDate.setHours(val)
    } else {
      baseDate.setMinutes(val)
    }
    baseDate.setSeconds(0)
    baseDate.setMilliseconds(0)
    onChange(baseDate)
  }

  const handleSetNow = () => {
    const now = new Date()
    now.setSeconds(0)
    now.setMilliseconds(0)
    onChange(now)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-200 h-10 px-3 group",
            !value && "text-slate-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
          <span className="flex-1 truncate">
            {value ? format(value, "PPP HH:mm") : placeholder}
          </span>
          {value && (
            <X
              className="ml-2 h-3.5 w-3.5 text-slate-500 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-slate-900 border-slate-800 shadow-xl shadow-black/20 rounded-xl overflow-hidden"
        align="start"
      >
        <div className="flex">
          {/* Calendar side */}
          <div className="border-r border-slate-800/60">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleDateSelect}
            />
          </div>

          {/* Time picker side */}
          <div className="flex flex-col w-[120px]">
            {/* Header */}
            <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 border-b border-slate-800/60">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Time</span>
            </div>

            {/* Scrollable columns */}
            <div className="flex flex-1 divide-x divide-slate-800/40">
              <TimeColumn
                items={HOURS}
                selected={hours}
                onSelect={(val) => handleTimeChange("hours", val)}
              />
              <TimeColumn
                items={MINUTES}
                selected={minutes}
                onSelect={(val) => handleTimeChange("minutes", val)}
              />
            </div>

            {/* Now button */}
            <div className="p-2 border-t border-slate-800/60">
              <button
                type="button"
                onClick={handleSetNow}
                className="w-full h-7 rounded-md text-[11px] font-semibold text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 transition-colors cursor-pointer"
              >
                Now
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
