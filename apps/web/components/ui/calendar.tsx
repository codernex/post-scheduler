"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-slate-900 text-slate-100 rounded-md", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-between items-center relative py-1",
        caption_label: "text-sm font-medium text-slate-200",
        nav: "flex items-center space-x-1",
        button_previous: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center text-slate-100 border border-slate-800 rounded-md cursor-pointer hover:bg-slate-800"
        ),
        button_next: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center text-slate-100 border border-slate-800 rounded-md cursor-pointer hover:bg-slate-800"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex w-full mt-2",
        weekday: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        weeks: "space-y-1",
        day: "h-9 w-9 p-0 font-normal hover:bg-slate-800 text-slate-100 flex items-center justify-center rounded-md cursor-pointer relative",
        day_button: "h-full w-full flex items-center justify-center rounded-md",
        selected: "bg-indigo-600! text-slate-100 font-semibold rounded-md",
        today: "border border-slate-700 font-bold",
        outside: "text-slate-600 opacity-50",
        disabled: "text-slate-700 opacity-30 cursor-not-allowed",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4 text-slate-400" />
          }
          return <ChevronRight className="h-4 w-4 text-slate-400" />
        }
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
