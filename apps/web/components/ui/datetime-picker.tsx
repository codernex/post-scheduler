"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
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

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date & time",
  className,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Extract date portion or fallback to today
  const dateValue = value ? value : undefined

  // Extract time parts or fallback
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-200 h-10 px-3",
            !value && "text-slate-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
          {value ? format(value, "PPP HH:mm") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800 shadow-xl rounded-lg" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleDateSelect}
        />
        <div className="flex items-center justify-between border-t border-slate-800 p-3 bg-slate-950/20">
          <span className="text-xs font-medium text-slate-400">Time</span>
          <div className="flex items-center gap-1">
            <select
              value={hours}
              onChange={(e) => handleTimeChange("hours", parseInt(e.target.value))}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-1.5 py-1 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 scrollbar-thin"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i} className="bg-slate-900 text-slate-200">
                  {i.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
            <span className="text-slate-500">:</span>
            <select
              value={minutes}
              onChange={(e) => handleTimeChange("minutes", parseInt(e.target.value))}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-1.5 py-1 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 scrollbar-thin"
            >
              {Array.from({ length: 60 }).map((_, i) => (
                <option key={i} value={i} className="bg-slate-900 text-slate-200">
                  {i.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
