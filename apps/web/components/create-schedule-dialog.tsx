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
import { useUser } from "@/lib/user-context";
import { UpgradeModal } from "@/components/upgrade-modal";

export interface CreateScheduleDialogProps {
  /** List of connected social platforms (must have `id` and `name`) */
  platforms: Array<{ id: number; name: string; connected?: boolean }>;
  /** Controls dialog visibility */
  open: boolean;
  /** Called when the dialog should open or close */
  onOpenChange: (open: boolean) => void;
  /** Called after a schedule is successfully created — use to refetch data */
  onScheduleCreated: () => void;
  /** List of currently existing schedules to enforce limits */
  schedules?: Array<{
    id: number;
    social_media_id: number;
    scheduled_at: string;
    recurrence: number;
    recurrence_unit: string;
    max_runs: number;
    runs_completed: number;
    status: string;
    prompt?: string | null;
  }>;
}

export function CreateScheduleDialog({
  platforms,
  open,
  onOpenChange,
  onScheduleCreated,
  schedules = [],
}: CreateScheduleDialogProps) {
  const { isAdmin, isPro } = useUser();
  const hasUnlimitedAccess = isAdmin || isPro;

  
  // Form state
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  const [recurrence, setRecurrence] = useState<number>(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState<string>("day");
  const [maxRuns, setMaxRuns] = useState<number>(1);
  const [prompt, setPrompt] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Upgrade modal state
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  // Determine if standard user has already scheduled posts on some platform
  const existingPlatformIds = React.useMemo(() => {
    if (!schedules || schedules.length === 0) return [];
    return Array.from(new Set(schedules.map(s => s.social_media_id)));
  }, [schedules]);

  const scheduledPlatformId = existingPlatformIds[0]; // Free tier is limited to 1 platform total
  const isMaxRunsExceeded = !hasUnlimitedAccess && maxRuns > 10;

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

    // Limit enforcement on submit
    if (!hasUnlimitedAccess && maxRuns > 10) {
      setUpgradeReason("The Free plan is limited to a maximum of 10 runs per schedule configuration.");
      setIsUpgradeOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      // Include the browser's timezone offset so the backend knows the user's local time
      const dateTimeWithOffset = format(scheduledAt, "yyyy-MM-dd'T'HH:mm:ssxxx");

      const response = await createScheduleApiV1SchedulerPost({
        body: {
          social_media_id: parseInt(selectedPlatformId),
          scheduled_at: dateTimeWithOffset,
          recurrence: recurrence,
          recurrence_unit: recurrenceUnit,
          max_runs: maxRuns,
          prompt: prompt.trim() === "" ? undefined : prompt.trim(),
        },
      });

      if (response.error) {
        const errorBody = response.error as { detail?: string };
        const detail = errorBody?.detail || "Failed to create schedule";
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
    <>
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
                    {platforms.map((p) => {
                      const isInstagramDisabled =
                        p.name.toLowerCase().includes("instagram") ||
                        p.name.toLowerCase().includes("threads") ||
                        p.name.toLowerCase().includes("thread");
                      
                      // Free tier limit: only 1 platform schedule
                      const isPlatformLocked = 
                        !hasUnlimitedAccess && 
                        scheduledPlatformId !== undefined && 
                        p.id !== scheduledPlatformId;

                      const isDisabled = isInstagramDisabled || isPlatformLocked;

                      return (
                        <SelectItem
                          key={p.id}
                          value={p.id.toString()}
                          disabled={isDisabled}
                        >
                          {p.name} 
                          {isInstagramDisabled && " (Disabled)"}
                          {isPlatformLocked && " (Pro Only: Limited to 1 Platform)"}
                        </SelectItem>
                      );
                    })}
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
                className={`bg-slate-900/50 border-slate-800 text-slate-200 ${
                  isMaxRunsExceeded ? "border-amber-500/50 focus:ring-amber-500" : ""
                }`}
              />
              {isMaxRunsExceeded ? (
                <div className="text-[10px] text-amber-400 font-semibold mt-1">
                  ⚠️ Free plan is limited to maximum of 10 runs per schedule. Please upgrade to Pro for unlimited.
                </div>
              ) : (
                <span className="text-[10px] text-slate-500">
                  Post every {recurrence} {recurrenceUnit}(s), up to{" "}
                  <span className="text-indigo-400 font-semibold">{maxRuns}</span>{" "}
                  {maxRuns === 1 ? "time" : "times"} total.
                </span>
              )}
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

      <UpgradeModal
        open={isUpgradeOpen}
        onOpenChange={setIsUpgradeOpen}
        reason={upgradeReason}
      />
    </>
  );
}

