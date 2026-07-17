import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import GoogleAnalyticsTracker from "@/components/google-analytics-tracker";
import CookieConsentBanner from "@/components/cookie-consent-banner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Post Scheduler",
  description: "Schedule your posts across social media platforms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-950 text-slate-100`}>
        <GoogleAnalyticsTracker />
        {children}
        <CookieConsentBanner />
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
