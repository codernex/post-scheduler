"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { 
  Check, 
  X, 
  Sparkles, 
  Loader2, 
  ShieldAlert, 
  HelpCircle 
} from "lucide-react";
import { upgradeUserApiV1UsersUpgradePost } from "@repo/api-client";
import { useUser } from "@/lib/user-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UpgradePage() {
  const { user, refreshUser, loading: loadingUser } = useUser();
  const [submitting, setSubmitting] = useState(false);

  const handleToggleUpgrade = async () => {
    try {
      setSubmitting(true);
      const response = await upgradeUserApiV1UsersUpgradePost();
      if (response.error) {
        const errorBody = response.error as { detail?: string };
        const detail = errorBody?.detail || "Operation failed";
        toast.error(typeof detail === "string" ? detail : JSON.stringify(detail), {

          icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
        });
      } else {
        const isUpgraded = response.data?.role === "admin";
        toast.success(
          isUpgraded 
            ? "Your account has been upgraded to Pro successfully!" 
            : "Your account was successfully downgraded to the Free Tier.",
          {
            icon: <Check className="w-5 h-5 text-emerald-500" />,
          }
        );
        await refreshUser();
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const isPro = user?.role === "admin";

  const freeFeatures = [
    "Up to 3 active posting schedules",
    "Limit to 1 platform for schedules",
    "Maximum of 10 runs per schedule",
    "Standard Uvicorn worker queue",
    "Standard Gemini-2.0-Flash AI writing agent",
  ];

  const proFeatures = [
    "Unlimited schedule configurations",
    "Connect and schedule on multiple platforms concurrently",
    "Unlimited runs per schedule config",
    "Priority AI agent queue with extended memory",
    "Deep LangChain long-term context integration",
    "Advanced performance audit logs and details",
    "Premium support and analytics dashboard",
  ];

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto w-full relative">
      {/* Glow backgrounds */}
      <div className="absolute top-10 left-1/3 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-3 relative z-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SaaS Pricing Rollout</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-50 to-slate-200 bg-clip-text text-transparent">
          Simple, Transparent Pricing
        </h1>
        <p className="text-slate-400 text-sm">
          Select the subscription tier that best matches your scale. Toggle between plans during this experimental preview.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 pt-4">
        {/* Free Plan */}
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md flex flex-col justify-between hover:border-slate-700/80 transition-all">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-slate-100 font-bold">Free Plan</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Ideal for personal testing and basic automation.
            </CardDescription>
            <div className="pt-4">
              <span className="text-4xl font-black text-slate-100">$0</span>
              <span className="text-slate-500 text-sm ml-1">/ month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            <div className="border-t border-slate-800/80 my-2" />
            <ul className="space-y-3">
              {freeFeatures.map((feat, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
              <li className="flex items-start gap-2.5 text-xs text-slate-500">
                <X className="w-4 h-4 text-slate-750 shrink-0 mt-0.5" />
                <span className="line-through">Unlimited connected platforms</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-500">
                <X className="w-4 h-4 text-slate-750 shrink-0 mt-0.5" />
                <span className="line-through">Unlimited scheduler runs</span>
              </li>
            </ul>
          </CardContent>
          <div className="p-6 pt-0">
            <Button
              disabled={loadingUser || submitting || !isPro}
              onClick={handleToggleUpgrade}
              className={`w-full h-10 font-bold text-xs cursor-pointer ${
                !isPro 
                  ? "bg-slate-850 text-slate-400 border border-slate-800 hover:bg-slate-850 cursor-default" 
                  : "bg-indigo-650 hover:bg-indigo-650/80 text-white"
              }`}
            >
              {!isPro ? "Current Plan" : "Downgrade (Reset)"}
            </Button>
          </div>
        </Card>

        {/* Pro Plan */}
        <Card className="bg-slate-900/60 border-indigo-500/30 backdrop-blur-md flex flex-col justify-between shadow-xl shadow-indigo-500/5 relative hover:border-indigo-500/50 transition-all">
          <div className="absolute -top-3 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow border border-indigo-400/20 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Popular
          </div>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-slate-100 font-bold flex items-center gap-2">
              <span>Scheduler Pro</span>
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Automated social media expansion with AI.
            </CardDescription>
            <div className="pt-4">
              <span className="text-4xl font-black text-slate-100">$15</span>
              <span className="text-slate-500 text-sm ml-1">/ month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            <div className="border-t border-slate-800/80 my-2" />
            <ul className="space-y-3">
              {proFeatures.map((feat, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-medium">{feat}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <div className="p-6 pt-0">
            <Button
              disabled={loadingUser || submitting}
              onClick={handleToggleUpgrade}
              className={`w-full h-10 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 ${
                isPro 
                  ? "bg-slate-850 text-slate-400 border border-slate-800 hover:bg-slate-850 cursor-default" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/20"
              }`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPro ? "Current Plan" : "Upgrade to Pro"}
            </Button>
          </div>
        </Card>
      </div>

      {/* FAQ Banner */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-6 relative z-10 flex flex-col sm:flex-row items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 shrink-0">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold text-slate-200">How do tier upgrades work?</h3>
          <p className="text-xs text-slate-400 leading-normal">
            During this experimental preview, upgrading to Pro toggles your user account to have the <code className="text-indigo-300 font-mono text-[11px]">admin</code> role, lifting all limits. Later, we will integrate payment gateways like Stripe for actual billing logic.
          </p>
        </div>
      </div>
    </div>
  );
}
