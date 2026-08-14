"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Settings, 
  Sparkles, 
  CheckCircle2, 
  User, 
  ShieldCheck, 
  Mail, 
  Clock, 
  Loader2, 
  Save 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser } from "@/lib/user-context";
import { getTokenCookie } from "@/lib/auth-client";

export default function SettingsPage() {
  const { user, loading, refreshUser } = useUser();
  const [autoPost, setAutoPost] = useState<boolean>(true);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setAutoPost((user as any).auto_post ?? true);
      setEmailNotifications((user as any).email_notifications ?? true);
    }
  }, [user]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const token = getTokenCookie();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/v1/users/me", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          auto_post: autoPost,
          email_notifications: emailNotifications,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.detail || "Failed to update settings.");
      } else {
        toast.success("Settings saved successfully!", {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        });
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-50 to-slate-200 bg-clip-text text-transparent flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-indigo-400" />
          <span>Account Settings</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your AI posting preferences, default schedule options, and account info.
        </p>
      </div>

      {/* AI Post Generation Settings Card */}
      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            AI Agent Post Generation & Notification Settings
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Control auto-publishing behavior and email alerts when AI post drafts are ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Default Auto-Publish */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-slate-950/40 border border-slate-800/80">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-200">
                Default Auto-Publish Mode
              </h4>
              <p className="text-xs text-slate-400 max-w-xl">
                When enabled, posts created by the agent will automatically publish when scheduled.
                When disabled, generated posts will be saved as drafts for you to modify and approve.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoPost}
                onChange={(e) => setAutoPost(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-xs font-semibold text-slate-300">
                {autoPost ? "Auto Post Enabled" : "Manual Review / Draft"}
              </span>
            </label>
          </div>

          {/* Email Notifications for Draft Posts */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-slate-950/40 border border-slate-800/80">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                Email Notifications for Draft Posts
              </h4>
              <p className="text-xs text-slate-400 max-w-xl">
                Receive an email alert whenever the AI agent generates a post draft that requires your review and approval before publishing.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-xs font-semibold text-slate-300">
                {emailNotifications ? "Emails Enabled" : "Emails Disabled"}
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Account & Profile Card */}
      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            Profile & Account Information
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Your personal details and subscription plan overview.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-950/30 border border-slate-800/60 space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Username
            </div>
            <div className="text-sm font-semibold text-slate-200">{user?.username || "—"}</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/30 border border-slate-800/60 space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
            </div>
            <div className="text-sm font-semibold text-slate-200">{user?.email || "—"}</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/30 border border-slate-800/60 space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Account Role & Tier
            </div>
            <div className="text-sm font-semibold text-slate-200 capitalize">
              {user?.role || "User"} • {user?.tier || "Free"} Plan
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/30 border border-slate-800/60 space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Account Created
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button Bar */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white gap-2 font-medium h-10 px-6 cursor-pointer shadow-lg shadow-indigo-500/15"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Settings</span>
        </Button>
      </div>
    </div>
  );
}
