"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginApiV1AuthLoginPost, signupApiV1AuthSignupPost } from "@repo/api-client";
import { setTokenCookie } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldAlert } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const response = await loginApiV1AuthLoginPost({
          body: {
            email: formData.email,
            password: formData.password,
          },
        });

        if (response.error) {
          const detail = (response.error as any)?.detail || "Login failed";
          toast.error(typeof detail === "string" ? detail : JSON.stringify(detail), {
            icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
          });
        } else if (response.data) {
          const { access_token, user } = response.data;
          setTokenCookie(access_token);
          toast.success(`Welcome back, ${user.username}!`, {
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          });
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        const response = await signupApiV1AuthSignupPost({
          body: {
            username: formData.username,
            email: formData.email,
            password: formData.password,
          },
        });

        if (response.error) {
          const detail = (response.error as any)?.detail || "Signup failed";
          toast.error(typeof detail === "string" ? detail : JSON.stringify(detail), {
            icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
          });
        } else if (response.data) {
          toast.success("Account created successfully! Logging you in...", {
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          });
          
          // Log in automatically after signup
          const loginResponse = await loginApiV1AuthLoginPost({
            body: {
              email: formData.email,
              password: formData.password,
            },
          });

          if (loginResponse.data) {
            const { access_token } = loginResponse.data;
            setTokenCookie(access_token);
            router.push("/dashboard");
            router.refresh();
          } else {
            setMode("login");
          }
        }
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 overflow-hidden font-sans">
      {/* Background blobs for premium glassmorphism effect */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl relative z-10 mx-4">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg
                className="h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            {mode === "login"
              ? "Enter your email and password below"
              : "Register to get started scheduling posts"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Username
                </label>
                <Input
                  placeholder="john_doe"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="bg-slate-950/40 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 h-11"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <Input
                placeholder="you@example.com"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="bg-slate-950/40 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <Input
                placeholder="••••••••"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="bg-slate-950/40 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/25 transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center justify-center space-y-2">
            <span className="text-sm text-slate-400">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {mode === "login" ? "Create an account" : "Sign in to existing account"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}