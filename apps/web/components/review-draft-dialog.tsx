"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getTokenCookie } from "@/lib/auth-client";

interface Schedule {
  id: number;
  social_media_id: number;
  draft_post_text?: string | null;
  draft_image_url?: string | null;
  prompt?: string | null;
}

export interface ReviewDraftDialogProps {
  schedule: Schedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDraftProcessed: () => void;
}

export function ReviewDraftDialog({
  schedule,
  open,
  onOpenChange,
  onDraftProcessed,
}: ReviewDraftDialogProps) {
  const [postText, setPostText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (schedule?.draft_post_text) {
      setPostText(schedule.draft_post_text);
    } else {
      setPostText("");
    }
  }, [schedule]);

  if (!schedule) return null;

  const handleApprove = async () => {
    if (!postText.trim()) {
      toast.error("Post content cannot be empty.");
      return;
    }

    try {
      setSubmitting(true);
      const token = getTokenCookie();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/v1/scheduler/${schedule.id}/approve`, {
        method: "POST",
        headers,
        body: JSON.stringify({ post_text: postText.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.detail || "Failed to publish post.");
      } else {
        toast.success("Post approved & published successfully!", {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        });
        onOpenChange(false);
        onDraftProcessed();
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while publishing.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to discard this draft?")) return;

    try {
      setRejecting(true);
      const token = getTokenCookie();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/v1/scheduler/${schedule.id}/reject`, {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.detail || "Failed to reject draft.");
      } else {
        toast.success("Draft discarded. Schedule reset for next run.");
        onOpenChange(false);
        onDraftProcessed();
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while rejecting draft.");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-400">
            <Sparkles className="w-5 h-5" /> Review & Edit AI Draft
          </DialogTitle>
          <DialogDescription>
            The AI agent generated this post for Schedule #{schedule.id}. You can modify the text below before publishing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {schedule.prompt && (
            <div className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded border border-slate-800/60">
              <strong className="text-slate-300">Prompt used:</strong> &ldquo;{schedule.prompt}&rdquo;
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">
                Post Content (Editable)
              </label>
              <span className="text-[10px] text-slate-500">
                {postText.length} characters
              </span>
            </div>
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              rows={7}
              className="w-full rounded-md border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
              placeholder="Edit your post content here..."
            />
          </div>

          {schedule.draft_image_url && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">
                Generated Image Preview
              </label>
              <div className="rounded-md overflow-hidden border border-slate-800 bg-slate-950 max-h-48 flex justify-center items-center">
                <img
                  src={schedule.draft_image_url}
                  alt="Generated draft media"
                  className="max-h-48 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReject}
            disabled={rejecting || submitting}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5 h-10"
          >
            {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            <span>Discard Draft</span>
          </Button>

          <Button
            type="button"
            onClick={handleApprove}
            disabled={submitting || rejecting || !postText.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-medium h-10 px-5"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Approve & Publish Now</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
