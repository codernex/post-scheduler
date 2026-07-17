import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service | PostScheduler",
  description: "Read the terms and conditions governing the use of PostScheduler.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600/30 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Glow Blobs */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto space-y-12 relative z-10">
        
        {/* Navigation */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
            <FileText className="h-3.5 w-3.5" />
            <span>Usage Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Last updated: July 18, 2026</p>
        </div>

        {/* Terms Body */}
        <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100">1. Acceptance of Terms</h2>
            <p>
              By accessing and using PostScheduler (the &quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100">2. Description of Service</h2>
            <p>
              PostScheduler is a Software-as-a-Service platform that enables users to schedule and automate social media publications using AI agents. Certain advanced capabilities require a paid subscription (the &quot;Pro Plan&quot;).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100">3. User Accounts</h2>
            <p>
              To use the Service, you must create an account. You are responsible for maintaining the confidentiality of your account credentials, passwords, and API tokens. You are fully responsible for all activities that occur under your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100">4. Prohibited Activities</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Publish content that is illegal, defamatory, or violates third-party intellectual property rights.</li>
              <li>Spam, abuse, or engage in automated mass-activity that violates social network platform terms (LinkedIn, Facebook).</li>
              <li>Reverse engineer, exploit, or bypass the Service&apos;s usage limitations and database schemas.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100">5. Limitation of Liability</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind. PostScheduler shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use or inability to use the Service, including publishing delays or API connection losses.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100">6. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at our sole discretion, without notice, if you violate these terms or engage in behavior harmful to other users or the Service&apos;s infrastructure.
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
