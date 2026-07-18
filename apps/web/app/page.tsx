import type { Metadata } from "next";
import LandingPageClient from "@/components/landing-page-client";

export const metadata: Metadata = {
  title: "Post Scheduler & Social Media Autopilot | PostScheduler",
  description: "Automate your social posting queue. PostScheduler is a smart AI post scheduler that uses LangChain, Google Gemini, and Supermemory to draft and schedule unique, non-repetitive posts to LinkedIn and Facebook.",
  keywords: [
    "Post Scheduler",
    "Social Media Scheduler",
    "AI Post Scheduler",
    "LinkedIn Post Scheduler",
    "Facebook Post Scheduler",
    "AI Scheduling",
    "Social Media Automation",
    "Gemini AI",
    "Supermemory DB"
  ],
  openGraph: {
    title: "Post Scheduler & Social Media Autopilot | PostScheduler",
    description: "Automate your social posting queue. PostScheduler is a smart AI post scheduler that uses LangChain, Google Gemini, and Supermemory to draft and schedule unique, non-repetitive posts to LinkedIn and Facebook.",
    type: "website",
    url: "https://post-scheduler.codernex.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "Post Scheduler & Social Media Autopilot | PostScheduler",
    description: "Automate your social posting queue. PostScheduler is a smart AI post scheduler that uses LangChain, Google Gemini, and Supermemory to draft and schedule unique, non-repetitive posts to LinkedIn and Facebook.",
  }
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "PostScheduler",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "description": "An AI-powered post scheduler that automates social media scheduling on LinkedIn and Facebook using LangChain and Google Gemini.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient />
    </>
  );
}