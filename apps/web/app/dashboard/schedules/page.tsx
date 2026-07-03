"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  deleteScheduleApiV1SchedulerScheduleIdDelete,
  getScheduleApiV1SchedulerGet,
  getScheduleLogsApiV1SchedulerScheduleIdLogsGet,
  getSocialConnectionStatusApiV1SocialMediaStatusGet
} from "@repo/api-client";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Layers,
  ListTodo,
  Loader2,
  Plus,
  Search,
  Trash2,
  XCircle
} from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { CreateScheduleDialog } from "@/components/create-schedule-dialog";

type FilterTab = "ALL" | "SCHEDULED" | "PUBLISHED" | "FAILED";

function SchedulesContent() {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Creation Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Logs Dialog state
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [selectedScheduleLogs, setSelectedScheduleLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsScheduleId, setLogsScheduleId] = useState<number | null>(null);

  const fetchStatusAndSchedules = async () => {
    try {
      setLoading(true);
      const [platformRes, scheduleRes] = await Promise.all([
        getSocialConnectionStatusApiV1SocialMediaStatusGet(),
        getScheduleApiV1SchedulerGet()
      ]);
      
      if (platformRes.data) {
        setPlatforms(platformRes.data);
      }
      if (scheduleRes.data) {
        setSchedules(scheduleRes.data);
      }
    } catch (err) {
      console.error("Failed to load page data", err);
      toast.error("Failed to load schedules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndSchedules();
  }, []);

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
        fetchStatusAndSchedules();
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

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PUBLISHED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" /> Published
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-3.5 h-3.5" /> Scheduled
          </span>
        );
    }
  };

  // Filters and searches schedules list
  const filteredSchedules = schedules.filter((schedule) => {
    const platformName = platforms.find(p => p.id === schedule.social_media_id)?.name || "LinkedIn";
    
    // Status filter
    if (activeTab !== "ALL" && schedule.status.toUpperCase() !== activeTab) {
      return false;
    }

    // Search query filter (by platform name, prompt or date)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const formattedDate = format(new Date(schedule.scheduled_at), "PPP HH:mm").toLowerCase();
      const matchPlatform = platformName.toLowerCase().includes(query);
      const matchDate = formattedDate.includes(query);
      const matchStatus = schedule.status.toLowerCase().includes(query);
      const matchPrompt = schedule.prompt ? schedule.prompt.toLowerCase().includes(query) : false;
      
      return matchPlatform || matchDate || matchStatus || matchPrompt;
    }

    return true;
  });

  const connectedPlatforms = platforms.filter(p => p.connected);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-50 to-slate-200 bg-clip-text text-transparent">
            Schedules Queue
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review, filter, and plan your automated publication queue.
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white gap-2 font-medium shadow-lg shadow-indigo-500/15 h-10 px-4 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Schedule</span>
        </Button>

        <CreateScheduleDialog
          platforms={connectedPlatforms}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onScheduleCreated={fetchStatusAndSchedules}
        />
      </div>

      {/* Main Table Card */}
      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex bg-slate-950/40 p-1 rounded-lg border border-slate-800/60 self-start">
              {(["ALL", "SCHEDULED", "PUBLISHED", "FAILED"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    activeTab === tab
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  {tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Search schedules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-950/20 border-slate-800/80 text-slate-200 placeholder:text-slate-500 text-sm h-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center p-8 text-center">
              <CalendarIcon className="w-10 h-10 text-slate-700 mb-2.5" />
              <h3 className="text-base font-semibold text-slate-300">No schedules found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {searchQuery !== ""
                  ? "Try adjusting your search criteria or filter options."
                  : "Get started by planning your very first automated post calendar schedule."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-200">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold bg-slate-950/10">
                    <th className="p-4 pl-6">ID</th>
                    <th className="p-4">Platform</th>
                    <th className="p-4">Recurrence</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4">Scheduled Date</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSchedules.map((schedule) => {
                    const platformName = platforms.find(p => p.id === schedule.social_media_id)?.name || "LinkedIn";
                    return (
                      <tr 
                        key={schedule.id}
                        className="hover:bg-slate-900/20 transition-colors"
                      >
                        <td className="p-4 pl-6 font-mono text-xs text-slate-500">#{schedule.id}</td>
                        <td className="p-4">
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {platformName.toLowerCase() === "linkedin" ? (
                              <svg className="w-4 h-4 fill-current text-blue-400 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            ) : (
                              <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                            )}
                            <span>{platformName}</span>
                          </div>
                          {schedule.prompt && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic max-w-xs" title={schedule.prompt}>
                              Prompt: "{schedule.prompt}"
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-sm text-slate-300 whitespace-nowrap">
                          Every {schedule.recurrence} {schedule.recurrence_unit || "day"}(s)
                        </td>
                        <td className="p-4">
                          {(() => {
                            const completed = schedule.runs_completed ?? 0;
                            const total = schedule.max_runs ?? 1;
                            const pct = Math.round((completed / total) * 100);
                            return (
                              <div className="flex flex-col gap-1 min-w-[90px]">
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                  <span className="font-semibold text-slate-200">{completed}</span>
                                  <span className="text-slate-500">/ {total} runs</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-4 text-sm text-slate-300">
                          <div className="font-medium">
                            {format(new Date(schedule.scheduled_at), "PPP HH:mm")}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                            TimeZone: {schedule.user_timezone}
                          </div>
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {format(new Date(schedule.created_at), "PPP HH:mm")}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(schedule.status)}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              size="icon-xs" 
                              variant="ghost" 
                              className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                              onClick={() => handleOpenLogs(schedule.id)}
                              title="View History Logs"
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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

export default function SchedulesPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="w-6 h-6 border-2 border-slate-800 border-t-slate-400 rounded-full animate-spin" />
      </div>
    }>
      <SchedulesContent />
    </Suspense>
  );
}
