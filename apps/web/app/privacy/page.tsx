import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | PostScheduler",
  description: "Learn how PostScheduler collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600/30 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Glow Blobs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto space-y-12 relative z-10">
        
        {/* Navigation */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <Shield className="h-3.5 w-3.5" />
            <span>GDPR Compliant & Protected</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Last updated: July 18, 2026</p>
        </div>

        {/* Policy Body */}
        <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100">1. Introduction</h2>
            <p>
              Welcome to PostScheduler. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our scheduling services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100">2. Information We Collect</h2>
            <p>We may collect information about you in a variety of ways:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and message, when you voluntarily submit it to us through our contact forms or account signup.
              </li>
              <li>
                <strong>Social Network Credentials:</strong> To enable automated scheduling, we collect OAuth tokens for LinkedIn and Facebook. We encrypt and store these tokens securely; we do not store your passwords.
              </li>
              <li>
                <strong>Derivative Data:</strong> Information our servers automatically collect when you access the site, such as your IP address, browser type, operating system, and access times.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100">3. Analytics & Cookies</h2>
            <p>
              We use Google Analytics to analyze visitor traffic. Google Analytics uses cookies to track website interactions. We configure Google Analytics to anonymize your IP address. These cookies are only set if you explicitly accept cookie consent. You can withdraw your consent at any time via the consent decline button.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100">4. How We Use Your Information</h2>
            <p>We use the collected data to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Create and manage your user account.</li>
              <li>Execute social media scheduling tasks on your behalf.</li>
              <li>Respond to inquiries submitted via the contact form.</li>
              <li>Improve site performance, stability, and security.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100">5. GDPR Rights</h2>
            <p>Under GDPR, you have the following rights regarding your data:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Access:</strong> You can request copies of your personal data.</li>
              <li><strong>Erasure:</strong> You can request that we delete your data under certain conditions.</li>
              <li><strong>Data Portability:</strong> You can request that we transfer your data to another organization.</li>
              <li><strong>Withdraw Consent:</strong> You can revoke consent for tracking cookies at any time.</li>
            </ul>
            <p className="pt-2">
              To exercise any of these rights, please email us at <strong>support@post-scheduler.codernex.dev</strong>.
            </p>
          </section>

        </div>

        {/* Footer info */}
        <div className="pt-8 border-t border-slate-900 text-center text-xs text-slate-600">
          <p>© 2026 PostScheduler. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
}
