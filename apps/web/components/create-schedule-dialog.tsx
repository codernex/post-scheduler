"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { createScheduleApiV1SchedulerPost } from "@repo/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";

export interface CreateScheduleDialogProps {
  /** List of connected social platforms (must have `id` and `name`) */
  platforms: any[];
  /** Controls dialog visibility */
  open: boolean;
  /** Called when the dialog should open or close */
  onOpenChange: (open: boolean) => void;
  /** Called after a schedule is successfully created — use to refetch data */
  onScheduleCreated: () => void;
}

export function CreateScheduleDialog({
  platforms,
  open,
  onOpenChange,
  onScheduleCreated,
}: CreateScheduleDialogProps) {
  // Form state
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  const [recurrence, setRecurrence] = useState<number>(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState<string>("day");
  const [maxRuns, setMaxRuns] = useState<number>(1);
  const [prompt, setPrompt] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setSelectedPlatformId("");
    setScheduledAt(undefined);
    setRecurrence(1);
    setRecurrenceUnit("day");
    setMaxRuns(1);
    setPrompt("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlatformId) {
      toast.error("Please select a platform.");
      return;
    }
    if (!scheduledAt) {
      toast.error("Please select a schedule date and time.");
      return;
    }
    if (scheduledAt <= new Date()) {
      toast.error("Scheduled time must be in the future.");
      return;
    }
    if (recurrence < 1) {
      toast.error("Recurrence interval must be at least 1.");
      return;
    }
    if (maxRuns < 1) {
      toast.error("Max runs must be at least 1.");
      return;
    }

    try {
      setSubmitting(true);
      const naiveDateTimeStr = format(scheduledAt, "yyyy-MM-dd'T'HH:mm:ss");

      const response = await createScheduleApiV1SchedulerPost({
        body: {
          social_media_id: parseInt(selectedPlatformId),
          scheduled_at: naiveDateTimeStr,
          recurrence: recurrence,
          recurrence_unit: recurrenceUnit,
          max_runs: maxRuns,
          prompt: prompt.trim() === "" ? undefined : prompt.trim(),
        },
      });

      if (response.error) {
        const detail =
          (response.error as any)?.detail || "Failed to create schedule";
        toast.error(
          typeof detail === "string" ? detail : JSON.stringify(detail)
        );
      } else {
        toast.success("Schedule created successfully!", {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        });
        resetForm();
        onOpenChange(false);
        onScheduleCreated();
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while scheduling.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Schedule</DialogTitle>
          <DialogDescription>
            Plan your post recurrence, timezone and AI prompt instructions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Social Account */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              Social Account
            </label>
            {platforms.length === 0 ? (
              <div className="flex items-center gap-2 p-3 text-sm rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  No connected accounts. Please connect a platform first.
                </span>
              </div>
            ) : (
              <Select
                value={selectedPlatformId}
                onValueChange={setSelectedPlatformId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select connected platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              Prompt (optional)
            </label>
            <textarea
              placeholder="What would you like this post to be about? LLM will use this to write the post..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-slate-800 bg-slate-950/50 p-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-600 outline-none resize-none"
            />
          </div>

          {/* Schedule Date & Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              Schedule Date & Time
            </label>
            <DateTimePicker
              value={scheduledAt}
              onChange={setScheduledAt}
              placeholder="Select date & time"
            />
          </div>

          {/* Recurrence Interval */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              Recurrence Interval
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                value={recurrence}
                onChange={(e) => setRecurrence(parseInt(e.target.value) || 1)}
                className="bg-slate-900/50 border-slate-800 text-slate-200 flex-1"
              />
              <Select
                value={recurrenceUnit}
                onValueChange={setRecurrenceUnit}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Days</SelectItem>
                  <SelectItem value="hour">Hours</SelectItem>
                  <SelectItem value="minute">Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Max Runs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              Max Runs
            </label>
            <Input
              type="number"
              min="1"
              value={maxRuns}
              onChange={(e) => setMaxRuns(parseInt(e.target.value) || 1)}
              className="bg-slate-900/50 border-slate-800 text-slate-200"
            />
            <span className="text-[10px] text-slate-500">
              Post every {recurrence} {recurrenceUnit}(s), up to{" "}
              <span className="text-indigo-400 font-semibold">{maxRuns}</span>{" "}
              {maxRuns === 1 ? "time" : "times"} total.
            </span>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={submitting || platforms.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 text-white w-full cursor-pointer h-10 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Schedule Post</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
