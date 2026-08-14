"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { updateScheduleApiV1SchedulerScheduleIdPut } from "@repo/api-client";
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

export interface ScheduleItem {
  id: number;
  social_media_id: number;
  scheduled_at: string;
  recurrence: number;
  recurrence_unit: string;
  max_runs: number;
  runs_completed: number;
  status: string;
  prompt?: string | null;
}

export interface EditScheduleDialogProps {
  /** List of connected social platforms */
  platforms: Array<{ id: number; name: string; connected?: boolean }>;
  /** The schedule to edit/reschedule */
  schedule: ScheduleItem | null;
  /** Controls dialog visibility */
  open: boolean;
  /** Called when the dialog visibility changes */
  onOpenChange: (open: boolean) => void;
  /** Called after a schedule is successfully updated */
  onScheduleUpdated: () => void;
}

export function EditScheduleDialog({
  platforms,
  schedule,
  open,
  onOpenChange,
  onScheduleUpdated,
}: EditScheduleDialogProps) {
  const { isAdmin, isPro } = useUser();
  const hasUnlimitedAccess = isAdmin || isPro;

  // Form state
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  const [recurrence, setRecurrence] = useState<number>(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState<string>("day");
  const [maxRuns, setMaxRuns] = useState<number>(1);
  const [prompt, setPrompt] = useState<string>("");
  const [autoPost, setAutoPost] = useState<boolean>(true);
  const [resetRunsCompleted, setResetRunsCompleted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);

  // Upgrade modal state
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  useEffect(() => {
    if (schedule) {
      setSelectedPlatformId(schedule.social_media_id.toString());
      setScheduledAt(schedule.scheduled_at ? new Date(schedule.scheduled_at) : undefined);
      setRecurrence(schedule.recurrence ?? 1);
      setRecurrenceUnit(schedule.recurrence_unit || "day");
      setMaxRuns(schedule.max_runs ?? 1);
      setPrompt(schedule.prompt || "");
      setAutoPost((schedule as any).auto_post ?? true);
      setResetRunsCompleted(false);
    }
  }, [schedule, open]);

  const isMaxRunsExceeded = !hasUnlimitedAccess && maxRuns > 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schedule) return;

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
    if (prompt.length > 1000) {
      toast.error("Prompt must be at most 1000 characters.");
      return;
    }

    if (!hasUnlimitedAccess && maxRuns > 10) {
      setUpgradeReason("The Free plan is limited to a maximum of 10 runs per schedule configuration.");
      setIsUpgradeOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      const dateTimeWithOffset = format(scheduledAt, "yyyy-MM-dd'T'HH:mm:ssxxx");

      const response = await updateScheduleApiV1SchedulerScheduleIdPut({
        path: {
          schedule_id: schedule.id,
        },
        body: {
          social_media_id: parseInt(selectedPlatformId),
          scheduled_at: dateTimeWithOffset,
          recurrence: recurrence,
          recurrence_unit: recurrenceUnit,
          max_runs: maxRuns,
          prompt: prompt.trim() === "" ? null : prompt.trim(),
          reset_runs_completed: resetRunsCompleted,
          auto_post: autoPost,
        },
      });


      if (response.error) {
        const errorBody = response.error as { detail?: string };
        const detail = errorBody?.detail || "Failed to update schedule";
        toast.error(
          typeof detail === "string" ? detail : JSON.stringify(detail)
        );
      } else {
        toast.success("Schedule updated and rescheduled!", {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        });
        onOpenChange(false);
        onScheduleUpdated();
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while updating schedule.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit & Reschedule Post</DialogTitle>
            <DialogDescription>
              Update prompt, times, recurrence, and status for Schedule #{schedule?.id}.
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
                  <span>No connected accounts available.</span>
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

                      const isFacebookDisabled =
                        p.name.toLowerCase().includes("facebook");

                      const isDisabled = isInstagramDisabled || isFacebookDisabled;

                      return (
                        <SelectItem
                          key={p.id}
                          value={p.id.toString()}
                          disabled={isDisabled}
                        >
                          {p.name}
                          {isInstagramDisabled && " (Disabled)"}
                          {isFacebookDisabled && " (Temporarily Disabled)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Prompt */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400">
                  Prompt (optional)
                </label>
                <span className={`text-[10px] ${prompt.length >= 1000 ? "text-rose-500 font-semibold" : "text-slate-500"}`}>
                  {prompt.length} / 1000
                </span>
              </div>
              <textarea
                placeholder="What would you like this post to be about? LLM will use this to write the post..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={1000}
                className="w-full min-h-[80px] rounded-md border border-slate-800 bg-slate-950/50 p-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-600 outline-none resize-none"
              />
            </div>

            {/* Schedule Date & Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">
                New Schedule Date & Time
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

            {/* Auto Post Toggle */}
            <div className="flex items-center justify-between p-3 rounded-md bg-slate-950/40 border border-slate-800/80">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-slate-300">
                  Auto-Publish Created Post
                </label>
                <p className="text-[11px] text-slate-500">
                  {autoPost
                    ? "Automatically post when generated by AI agent."
                    : "Require manual review & edit before publishing."}
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoPost}
                onChange={(e) => setAutoPost(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Reset runs completed checkbox */}
            {schedule && (schedule.runs_completed > 0 || schedule.status === "FINISHED") && (
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="resetRuns"
                  checked={resetRunsCompleted}
                  onChange={(e) => setResetRunsCompleted(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="resetRuns" className="text-xs text-slate-300 flex items-center gap-1 cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  Reset completed runs counter ({schedule.runs_completed} / {schedule.max_runs} done)
                </label>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="submit"
                disabled={submitting || platforms.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 text-white w-full cursor-pointer h-10 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save & Reschedule</span>
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
