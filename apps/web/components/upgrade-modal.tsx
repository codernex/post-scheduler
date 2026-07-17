"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { 
  Check, 
  Sparkles, 
  Loader2, 
  ShieldAlert, 
  Layers, 
  Infinity as InfinityIcon, 
  Zap 
} from "lucide-react";
import { upgradeUserApiV1UsersUpgradePost } from "@repo/api-client";
import { useUser } from "@/lib/user-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
}

export function UpgradeModal({ open, onOpenChange, reason }: UpgradeModalProps) {
  const { refreshUser } = useUser();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const response = await upgradeUserApiV1UsersUpgradePost();
      if (response.error) {
        const errorBody = response.error as { detail?: string };
        const detail = errorBody?.detail || "Failed to upgrade";
        toast.error(typeof detail === "string" ? detail : JSON.stringify(detail), {

          icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
        });
      } else {
        toast.success("Welcome to Pro! Your account has been upgraded.", {
          icon: <Check className="w-5 h-5 text-emerald-500" />,
        });
        await refreshUser();
        onOpenChange(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred during upgrade.");
    } finally {
      setLoading(false);
    }
  };

  const proFeatures = [
    {
      icon: <InfinityIcon className="w-4 h-4 text-indigo-400" />,
      title: "Unlimited Schedules",
      desc: "Create as many scheduled posts as you need."
    },
    {
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
      title: "Multi-Platform Connection",
      desc: "Schedule posts across LinkedIn and Facebook simultaneously."
    },
    {
      icon: <InfinityIcon className="w-4 h-4 text-indigo-400" />,
      title: "Unlimited Runs",
      desc: "Remove the 10-run limit on recurring tasks."
    },
    {
      icon: <Zap className="w-4 h-4 text-indigo-400" />,
      title: "Priority LangChain AI Agent",
      desc: "Enhanced context window & speed using premium Gemini models."
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-slate-900/90 border-slate-800 backdrop-blur-xl">
        <DialogHeader className="space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400 text-sm">
            {reason ? (
              <span className="text-indigo-300 font-semibold block mb-1">
                {reason}
              </span>
            ) : null}
            Unlock the full potential of PostScheduler and automate your social media scaling.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-3">
            {proFeatures.map((feat, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-800/80 bg-slate-950/20"
              >
                <div className="h-7 w-7 rounded bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/10 mt-0.5">
                  {feat.icon}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{feat.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/50 to-slate-950/50 border border-indigo-500/20 text-center space-y-1">
            <div className="text-2xl font-black text-slate-100">$15 <span className="text-sm font-normal text-slate-400">/ month</span></div>
            <p className="text-[10px] text-slate-500">Cancel anytime. 7-day money-back guarantee.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-1/2 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 cursor-pointer h-10 order-2 sm:order-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full sm:w-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold cursor-pointer h-10 flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Upgrade Now</span>
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
