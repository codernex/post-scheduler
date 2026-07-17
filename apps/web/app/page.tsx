import type { Metadata } from "next";
import LandingPageClient from "@/components/landing-page-client";

export const metadata: Metadata = {
  title: "PostScheduler | AI-Driven Social Media Autopilot",
  description: "Set your social posting on autopilot. PostScheduler uses LangChain, Gemini-2.0-Flash, and Supermemory to schedule unique, non-repetitive posts to LinkedIn and Facebook.",
  keywords: ["AI Scheduling", "Social Media Automation", "Gemini AI", "Supermemory DB", "SaaS Agent", "LangChain"],
  openGraph: {
    title: "PostScheduler | AI-Driven Social Media Autopilot",
    description: "Set your social posting on autopilot. PostScheduler uses LangChain, Gemini, and Supermemory to schedule unique, non-repetitive posts to LinkedIn and Facebook.",
    type: "website",
    url: "https://post-scheduler.codernex.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "PostScheduler | AI-Driven Social Media Autopilot",
    description: "Set your social posting on autopilot. PostScheduler uses LangChain, Gemini, and Supermemory to schedule unique, non-repetitive posts to LinkedIn and Facebook.",
  }
};

export default function Page() {
  return <LandingPageClient />;
}