"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Share2, 
  Settings, 
  LogOut, 
  User 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initializeAuthClient, removeTokenCookie } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Sync the api-client config with the token stored in cookies
    initializeAuthClient();
  }, []);

  const handleLogout = () => {
    removeTokenCookie();
    router.push("/auth/login");
    router.refresh();
  };

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Schedules", href: "/dashboard/schedules", icon: CalendarDays, disabled: false },
    { name: "Platforms", href: "/dashboard/platforms", icon: Share2, disabled: true },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, disabled: true },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-900/40 backdrop-blur-md flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg
                className="h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-50 to-slate-200 bg-clip-text text-transparent">
              PostScheduler
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.disabled ? "#" : item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50",
                    item.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.disabled && (
                    <span className="ml-auto text-[10px] bg-slate-950 text-slate-500 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider scale-90">
                      Soon
                    </span>
                  )}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Footer profile & Sign Out */}
        <div className="space-y-4 pt-4 border-t border-slate-900">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 font-semibold border border-slate-700 shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate">
                Dashboard Session
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                Active User
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-3 px-3 py-2 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
