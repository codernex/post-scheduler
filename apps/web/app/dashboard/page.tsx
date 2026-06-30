"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getTokenCookie } from "@/lib/auth-client";
import { 
  getSocialConnectionStatusApiV1SocialMediaStatusGet,
  disconnectSocialPlatformApiV1SocialMediaDisconnectPlatformDelete,
  getScheduleApiV1SchedulerGet,
  createScheduleApiV1SchedulerPost,
  deleteScheduleApiV1SchedulerScheduleIdDelete,
  getScheduleLogsApiV1SchedulerScheduleIdLogsGet
} from "@repo/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { 
  CheckCircle2, 
  Calendar, 
  Plus, 
  TrendingUp, 
  Layers,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  ListTodo
} from "lucide-react";
import { format } from "date-fns";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Schedules state
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  // Creation Dialog & Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  const [recurrence, setRecurrence] = useState<number>(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState<string>("days");
  const [prompt, setPrompt] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Logs Dialog state
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [selectedScheduleLogs, setSelectedScheduleLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsScheduleId, setLogsScheduleId] = useState<number | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await getSocialConnectionStatusApiV1SocialMediaStatusGet();
      if (response.data) {
        setPlatforms(response.data);
        const linkedin = response.data.find((p: any) => p.name.toLowerCase() === "linkedin");
        if (linkedin) {
          setLinkedinConnected(linkedin.connected);
        }
      }
    } catch (err) {
      console.error("Failed to fetch platform connection status", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const response = await getScheduleApiV1SchedulerGet();
      if (response.data) {
        setSchedules(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch schedules", err);
      toast.error("Failed to load scheduled posts.");
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchSchedules();
  }, []);

  useEffect(() => {
    const connected = searchParams.get("connected");
    if (connected === "linkedin") {
      setLinkedinConnected(true);
      toast.success("LinkedIn account connected successfully!", {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      });
      // Clear query params
      router.replace("/dashboard");
      fetchStatus();
    }
  }, [searchParams, router]);

  const handleConnectLinkedIn = () => {
    const token = getTokenCookie();
    if (!token) {
      toast.error("Not authenticated. Please log in again.");
      return;
    }
    // Redirect to backend connect route with the JWT token
    window.location.href = `http://localhost:8081/api/v1/social-media/connect/linkedin?token=${token}`;
  };

  const handleDisconnectLinkedIn = async () => {
    try {
      const response = await disconnectSocialPlatformApiV1SocialMediaDisconnectPlatformDelete({
        path: {
          platform: "linkedin"
        }
      });
      if (response.error) {
        const detail = (response.error as any)?.detail || "Failed to disconnect";
        toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
      } else {
        toast.success("LinkedIn account disconnected successfully!", {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        });
        setLinkedinConnected(false);
        fetchStatus();
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while disconnecting.");
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
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
      toast.error("Recurrence must be at least 1.");
      return;
    }

    try {
      setSubmitting(true);
      // Format to naive datetime string matching backend expectation (YYYY-MM-DDTHH:mm:ss)
      const naiveDateTimeStr = format(scheduledAt, "yyyy-MM-dd'T'HH:mm:ss");

      const response = await createScheduleApiV1SchedulerPost({
        body: {
          social_media_id: parseInt(selectedPlatformId),
          scheduled_at: naiveDateTimeStr,
          recurrence: recurrence,
          recurrence_unit: recurrenceUnit,
          prompt: prompt.trim() === "" ? undefined : prompt.trim()
        }
      });

      if (response.error) {
        const detail = (response.error as any)?.detail || "Failed to create schedule";
        toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
      } else {
        toast.success("Schedule created successfully!", {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        });
        // Reset form and close dialog
        setSelectedPlatformId("");
        setScheduledAt(undefined);
        setRecurrence(1);
        setRecurrenceUnit("days");
        setPrompt("");
        setIsDialogOpen(false);
        fetchSchedules();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create schedule due to an unexpected error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm("Are you sure you want to remove this schedule? This action cannot be undone.")) return;
    try {
      const response = await deleteScheduleApiV1SchedulerScheduleIdDelete({
        path: {
          schedule_id: scheduleId
        }
      });

      if (response.error) {
        const detail = (response.error as any)?.detail || "Failed to remove schedule";
        toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
      } else {
        toast.success("Schedule removed successfully.");
        fetchSchedules();
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while deleting schedule.");
    }
  };

  const handleOpenLogs = async (scheduleId: number) => {
    setLogsScheduleId(scheduleId);
    setIsLogsOpen(true);
    setLoadingLogs(true);
    try {
      const response = await getScheduleLogsApiV1SchedulerScheduleIdLogsGet({
        path: {
          schedule_id: scheduleId
        }
      });
      if (response.data) {
        setSelectedScheduleLogs(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
      toast.error("Failed to load schedule history logs.");
    } finally {
      setLoadingLogs(false);
    }
  };

  // Filter connected platforms
  const connectedPlatforms = platforms.filter(p => p.connected);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PUBLISHED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" /> Published
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-3.5 h-3.5" /> Scheduled
          </span>
        );
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-50 to-slate-200 bg-clip-text text-transparent">
            Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor and schedule your social media presence.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white gap-2 font-medium shadow-lg shadow-indigo-500/15 h-10 px-4 cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>New Schedule</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Schedule</DialogTitle>
              <DialogDescription>
                Plan your post recurrence, timezone and AI prompt instructions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSchedule} className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Social Account</label>
                {connectedPlatforms.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 text-sm rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>No connected accounts. Please connect a platform first.</span>
                  </div>
                ) : (
                  <Select value={selectedPlatformId} onValueChange={setSelectedPlatformId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select connected platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {connectedPlatforms.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Prompt (optional)</label>
                <textarea
                  placeholder="What would you like this post to be about? LLM will use this to write the post..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full min-h-[80px] rounded-md border border-slate-800 bg-slate-950/50 p-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Schedule Date & Time</label>
                <DateTimePicker 
                  value={scheduledAt} 
                  onChange={setScheduledAt} 
                  placeholder="Select date & time"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Recurrence</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={recurrence}
                    onChange={(e) => setRecurrence(parseInt(e.target.value) || 1)}
                    className="bg-slate-900/50 border-slate-800 text-slate-200 flex-1"
                  />
                  <Select value={recurrenceUnit} onValueChange={setRecurrenceUnit}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-[10px] text-slate-500">Post will auto-schedule every {recurrence} {recurrenceUnit}.</span>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  disabled={submitting || connectedPlatforms.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white w-full cursor-pointer h-10 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Schedule Post</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics/Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-400">
              Connected Platforms
            </CardTitle>
            <Layers className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {linkedinConnected ? "1" : "0"} <span className="text-sm text-slate-500">/ 1</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">LinkedIn integration active</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-400">
              Scheduled Posts
            </CardTitle>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {schedules.filter(s => s.status === "SCHEDULED").length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {schedules.filter(s => s.status === "SCHEDULED").length === 1 ? "1 pending publication" : `${schedules.filter(s => s.status === "SCHEDULED").length} pending publications`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-400">
              Total Publications
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {schedules.filter(s => s.status === "PUBLISHED").length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Successfully published posts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Integrations Panel */}
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-200">
              Integrations
            </CardTitle>
            <CardDescription className="text-slate-400">
              Manage your linked social accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800/80 bg-slate-950/20 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center border border-blue-500/10">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">LinkedIn</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${linkedinConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {linkedinConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>
              </div>
              {linkedinConnected ? (
                <Button 
                  variant="outline" 
                  className="border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 h-9 px-3 cursor-pointer"
                  onClick={handleDisconnectLinkedIn}
                >
                  Disconnect
                </Button>
              ) : (
                <Button 
                  className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-3 font-medium transition-colors cursor-pointer"
                  onClick={handleConnectLinkedIn}
                >
                  Connect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule List / Empty State */}
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-200">
              Upcoming Schedules
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your next planned posts across all platforms.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {loadingSchedules ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : schedules.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg bg-slate-950/10">
                <Calendar className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400">No scheduled posts</p>
                <p className="text-xs text-slate-500 mt-1">Get started by creating a new scheduling calendar</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {schedules.map((schedule) => {
                  const platformName = platforms.find(p => p.id === schedule.social_media_id)?.name || "LinkedIn";
                  return (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-950/20 hover:bg-slate-950/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800 shrink-0">
                          {platformName.toLowerCase() === "linkedin" ? (
                            <svg className="w-4 h-4 fill-current text-blue-400" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          ) : (
                            <Layers className="w-4 h-4 text-indigo-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-slate-200">{platformName}</h4>
                            <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800/80 px-1.5 py-0.2 rounded font-medium">
                              Every {schedule.recurrence} {schedule.recurrence_unit || "days"}
                            </span>
                          </div>
                          {schedule.prompt && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic max-w-sm">
                              Prompt: "{schedule.prompt}"
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>
                              {format(new Date(schedule.scheduled_at), "PPP HH:mm")}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                              ({schedule.user_timezone})
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        {getStatusBadge(schedule.status)}
                        
                        <Button 
                          size="icon-xs" 
                          variant="ghost" 
                          className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                          onClick={() => handleOpenLogs(schedule.id)}
                          title="View Execution Logs"
                        >
                          <ListTodo className="w-4 h-4" />
                        </Button>

                        <Button 
                          size="icon-xs" 
                          variant="ghost" 
                          className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          title="Remove Schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs Dialog */}
      <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule History Logs</DialogTitle>
            <DialogDescription>
              Logs and execution history trace for Schedule #{logsScheduleId}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingLogs ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : selectedScheduleLogs.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded bg-slate-950/10 p-6 text-center">
                <Clock className="w-6 h-6 text-slate-600 mb-1" />
                <p className="text-sm text-slate-400 font-semibold">No logs recorded yet</p>
                <p className="text-xs text-slate-500 mt-1">Logs will appear here once the schedule starts running.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {selectedScheduleLogs.map((log) => (
                  <div key={log.id} className="p-3 border border-slate-800 bg-slate-950/20 rounded-md space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono">
                        {format(new Date(log.created_at), "PPP HH:mm:ss")}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.status === "INFO" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        log.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{log.post_content}</p>
                    {log.detail && (
                      <div className="text-[11px] text-slate-500 border-t border-slate-900/60 pt-2 mt-2 bg-slate-950/40 p-2 rounded">
                        <strong>Detail:</strong> {log.detail}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsLogsOpen(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-100 cursor-pointer h-9 px-4">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="w-6 h-6 border-2 border-slate-800 border-t-slate-400 rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
