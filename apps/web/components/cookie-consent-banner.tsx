"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, X } from "lucide-react";

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Small delay for smooth entry
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
    // Dispatch event to dynamically trigger GA load without full page reload
    window.dispatchEvent(new Event("cookie-consent-updated"));
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
    window.dispatchEvent(new Event("cookie-consent-updated"));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-md z-[100] bg-slate-900/95 border border-slate-800 p-5 rounded-2xl shadow-2xl shadow-indigo-500/5 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
          <Shield className="h-5 w-5" />
        </div>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="font-bold text-sm text-slate-100">Cookie Consent</h4>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-slate-500 hover:text-slate-300 p-0.5 rounded-md focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            We use Google Analytics cookies to analyze site traffic and improve your experience. Read our{" "}
            <Link href="/privacy" className="text-indigo-400 hover:underline">
              Privacy Policy
            </Link>{" "}
            to learn more.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              Accept All
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
