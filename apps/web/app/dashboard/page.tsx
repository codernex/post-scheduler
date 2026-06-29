"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getTokenCookie } from "@/lib/auth-client";
import { 
  getSocialConnectionStatusApiV1SocialMediaStatusGet,
  disconnectSocialPlatformApiV1SocialMediaDisconnectPlatformDelete
} from "@repo/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Calendar, 
  Plus, 
  TrendingUp, 
  Layers 
} from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await getSocialConnectionStatusApiV1SocialMediaStatusGet();
      if (response.data) {
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

  useEffect(() => {
    fetchStatus();
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
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white gap-2 font-medium shadow-lg shadow-indigo-500/15 h-10 px-4">
          <Plus className="w-4 h-4" />
          <span>New Schedule</span>
        </Button>
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
            <div className="text-2xl font-bold text-slate-100">0</div>
            <p className="text-xs text-slate-500 mt-1">No pending publications</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-400">
              Analytics Reach
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">--</div>
            <p className="text-xs text-slate-500 mt-1">Data updates automatically</p>
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
                  className="border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 h-9 px-3"
                  onClick={handleDisconnectLinkedIn}
                >
                  Disconnect
                </Button>
              ) : (
                <Button 
                  className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-3 font-medium transition-colors"
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
          <CardContent className="h-48 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg m-6 bg-slate-950/10">
            <Calendar className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">No scheduled posts</p>
            <p className="text-xs text-slate-500 mt-1">Get started by creating a new scheduling calendar</p>
          </CardContent>
        </Card>
      </div>
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
