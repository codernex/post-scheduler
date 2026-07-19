"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmailApiV1AuthVerifyEmailGet } from "@repo/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldAlert, Loader2, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing from the URL.");
      return;
    }

    const performVerification = async () => {
      try {
        const response = await verifyEmailApiV1AuthVerifyEmailGet({
          query: { token }
        });

        if (response.error) {
          const errorBody = response.error as { detail?: string };
          setStatus("error");
          setMessage(errorBody?.detail || "Verification failed. The token may be invalid or expired.");
        } else {
          setStatus("success");
          setMessage("Your email address has been successfully verified! You can now log in to your account.");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage("An unexpected error occurred during email verification.");
      }
    };

    performVerification();
  }, [token]);

  return (
    <Card className="w-full max-w-md bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl relative z-10 mx-4">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-2">
          {status === "loading" && (
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
          )}
          {status === "error" && (
            <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-lg shadow-rose-500/10">
              <ShieldAlert className="h-6 w-6 text-rose-500" />
            </div>
          )}
        </div>
        <CardTitle className="text-2xl text-center font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          {status === "loading" && "Verifying Email"}
          {status === "success" && "Account Activated!"}
          {status === "error" && "Verification Failed"}
        </CardTitle>
        <CardDescription className="text-center text-slate-400">
          {status === "loading" && "Please wait while we activate your account"}
          {status === "success" && "Welcome to PostScheduler"}
          {status === "error" && "An error occurred during activation"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-center text-slate-300 leading-relaxed">
          {message}
        </p>

        {status !== "loading" && (
          <Button
            onClick={() => router.push("/auth/login")}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/25 transition-all duration-200 gap-2 flex items-center justify-center"
          >
            <span>Go to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 overflow-hidden font-sans">
      {/* Background blobs for premium glassmorphism effect */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <Suspense fallback={
        <Card className="w-full max-w-md bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl relative z-10 mx-4">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Loading
            </CardTitle>
          </CardHeader>
        </Card>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
