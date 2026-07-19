"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Check, 
  Cpu, 
  Database, 
  Play, 
  Eye,
  Server,
  Zap,
  Menu,
  X,
  Lock
} from "lucide-react";
import { getTokenCookie } from "@/lib/auth-client";
import ContactForm from "./contact-form";
import { toast } from "sonner";

// Custom SVG Brand Icons
const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

// Simulation preset prompts
const PRESET_PROMPTS = [
  {
    title: "React Server Components",
    text: "Explain React Server Components vs Client Components",
    platform: "linkedin" as const,
    generated: `React Server Components (RSC) are changing how we build modern web apps. 🚀

RSC execute strictly on the server, which means:
• Zero bundle size impact for server-only libraries.
• Direct access to databases and backend resources.
• Faster initial page loads and cleaner data fetching.

Meanwhile, Client Components hydrate on the browser and handle interactive features like state, event listeners, and client-side hooks. 

The key is balance—combining server-side speed with client-side interactivity. How are you adopting RSC in your team? 

#ReactJS #NextJS #WebDevelopment #Frontend`
  },
  {
    title: "PostgreSQL Database Bloat",
    text: "Why you should keep an eye on PostgreSQL VACUUM and table bloat",
    platform: "linkedin" as const,
    generated: `Did you know PostgreSQL doesn't overwrite deleted rows in place? 🐘

Instead, it marks them as "dead tuples." Over time, this leads to table bloat and slows down queries. 

Enter VACUUM:
1️⃣ Reclaims storage from dead tuples.
2️⃣ Updates table statistics for the query planner.
3️⃣ Prevents transaction ID wraparound failures.

While autovacuum runs automatically, understanding manual VACUUM and ANALYZE is critical for large-scale production databases. Keep your databases healthy!

#PostgreSQL #Database #Backend #SoftwareEngineering`
  },
  {
    title: "AI Memory & Embeddings",
    text: "Intro to vector embeddings and RAG for social media scheduling",
    platform: "facebook" as const,
    generated: `Vector embeddings are the secret sauce behind semantic search and modern AI agents. 🧠

Put simply, embeddings turn complex data (text, images) into a list of numbers representing meaning. 

Why are they so powerful?
• Multi-dimensional mapping: Words with similar meanings are grouped closer together in vector space.
• Beyond exact keywords: Searching for "database cache" matches articles about "Redis performance."

They enable the retrieval step (RAG) that fuels our autonomous agents. Have you built search engines using vectors yet?

#MachineLearning #AI #VectorEmbeddings #Databases`
  }
];

export default function LandingPageClient() {
  const [hasToken, setHasToken] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Simulator States
  const [simulatorPlatform, setSimulatorPlatform] = useState<"linkedin" | "facebook">("linkedin");
  const [simulatorPrompt, setSimulatorPrompt] = useState(PRESET_PROMPTS[0]?.text || "");
  const [simulatorRecurrence, setSimulatorRecurrence] = useState("every 6 hours");
  const [simulatorLogs, setSimulatorLogs] = useState<string[]>([]);
  const [simulatorOutput, setSimulatorOutput] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    // Check if the user has an active login cookie
    const token = getTokenCookie();
    setHasToken(!!token);
  }, []);

  const handleSelectPreset = (preset: typeof PRESET_PROMPTS[0]) => {
    setSimulatorPlatform(preset.platform);
    setSimulatorPrompt(preset.text);
    setSimulatorOutput("");
    setSimulatorLogs([]);
  };

  const runSimulation = () => {
    if (isSimulating) return;
    if (simulatorPrompt.length > 1000) {
      toast.error("Prompt must be at most 1000 characters.");
      return;
    }
    
    setIsSimulating(true);
    setSimulatorLogs([]);
    setSimulatorOutput("");

    const steps = [
      { msg: "🤖 Agent initiated: Reading schedule prompt...", delay: 600 },
      { msg: "🔍 Querying Supermemory vector database with tag #agent-run...", delay: 1300 },
      { msg: "📊 Found 3 previous posts in series. Loading context to avoid repetitions...", delay: 2000 },
      { msg: "🧠 Routing to Gemini model (gemini-2.0-flash) for post generation...", delay: 2800 },
      { msg: "✨ Post generated successfully! Saving output to Supermemory vector store...", delay: 3600 },
      { msg: "🚀 Posting to LinkedIn / Facebook API...", delay: 4200 }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setSimulatorLogs((prev) => [...prev, step.msg]);
      }, step.delay);
    });

    // Final output text reveal
    setTimeout(() => {
      // Find preset matches or create a dynamic fallback post
      const matchedPreset = PRESET_PROMPTS.find(p => p.text.toLowerCase() === simulatorPrompt.toLowerCase());
      const postText = matchedPreset?.generated || `🚀 Implementing automation for "${simulatorPrompt}"!

By combining autonomous LangChain agents with a vector database (Supermemory), PostScheduler generates non-repetitive, context-aware posts.

Key Features:
• Custom schedule frequency: ${simulatorRecurrence}
• Multi-platform support: publishing to ${simulatorPlatform === "linkedin" ? "LinkedIn" : "Facebook"}
• AI-driven content generation

Stay tuned for more updates! #AI #Automation #WebDev`;

      let currentText = "";
      let index = 0;
      
      const interval = setInterval(() => {
        if (index < postText.length) {
          currentText += postText[index];
          setSimulatorOutput(currentText);
          index += 2; // Fast typing simulation
        } else {
          setSimulatorOutput(postText);
          clearInterval(interval);
          setIsSimulating(false);
        }
      }, 10);

    }, 4500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600/30">
      
      {/* Decorative Blur Blobs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse duration-7000"></div>
      <div className="absolute bottom-10 left-1/3 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              PostScheduler
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#simulator" className="hover:text-white transition-colors">Simulator</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <a 
              href="https://github.com/codernex/post-scheduler" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <GithubIcon className="h-4 w-4" /> Github
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {hasToken ? (
              <Link href="/dashboard">
                <button className="relative group overflow-hidden px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300">
                  Launch Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <span className="text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Sign In
                  </span>
                </Link>
                <Link href="/auth/login">
                  <button className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 rounded-md text-slate-400 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-900 bg-slate-950 px-4 pt-2 pb-4 space-y-3">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-400 hover:text-white py-1"
            >
              Features
            </a>
            <a 
              href="#simulator" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-400 hover:text-white py-1"
            >
              Simulator
            </a>
            <a 
              href="#how-it-works" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-400 hover:text-white py-1"
            >
              How it Works
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-400 hover:text-white py-1"
            >
              Pricing
            </a>
            <a 
              href="#contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-400 hover:text-white py-1"
            >
              Contact
            </a>
            <Link 
              href="/blog" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-400 hover:text-white py-1"
            >
              Blog
            </Link>
            <div className="pt-2 flex flex-col gap-3">
              {hasToken ? (
                <Link href="/dashboard">
                  <button className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-center text-white bg-gradient-to-r from-blue-600 to-indigo-600">
                    Launch Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login">
                    <button className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-center text-slate-300 bg-slate-900 border border-slate-800">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/auth/login">
                    <button className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-center text-white bg-gradient-to-r from-blue-600 to-indigo-600">
                      Sign Up
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Landmark */}
      <main>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <Sparkles className="h-3 w-3" />
            <span>AI-Driven Social Automation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none">
            Automate Your Queue with the Ultimate{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              AI Post Scheduler
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            PostScheduler uses LangChain agents, Google Gemini, and Supermemory to write, verify, and schedule unique, non-repetitive posts to LinkedIn and Facebook automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/auth/login">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 group">
                Start Posting Free <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <a 
              href="https://github.com/codernex/post-scheduler" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              <GithubIcon className="h-5 w-5" /> Star on GitHub
            </a>
          </div>

          {/* Tech Badges */}
          <div className="pt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-amber-500" /> Next.js 16</span>
            <span className="flex items-center gap-1.5"><Server className="h-4 w-4 text-emerald-500" /> FastAPI</span>
            <span className="flex items-center gap-1.5"><Database className="h-4 w-4 text-blue-500" /> PostgreSQL</span>
            <span className="flex items-center gap-1.5"><Cpu className="h-4 w-4 text-indigo-500" /> Gemini AI</span>
          </div>
        </div>
      </section>

      {/* Simulator Section */}
      <section id="simulator" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            See the Agent in Action
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Try drafting a scheduled series. Select a preset or type your own prompt, then click &quot;Generate&quot; to see our RAG automation loop run in real time.
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {PRESET_PROMPTS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(preset)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                simulatorPrompt === preset.text
                  ? "bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/5"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              Preset: {preset.title}
            </button>
          ))}
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Controls Box */}
          <div className="lg:col-span-5 bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between shadow-xl backdrop-blur-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="font-bold text-slate-200 text-sm tracking-wide uppercase">Scheduler Settings</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>

              {/* Platform selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Network</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSimulatorPlatform("linkedin")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                      simulatorPlatform === "linkedin"
                        ? "bg-blue-600/10 border-blue-500 text-blue-400"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400"
                    }`}
                  >
                    <LinkedinIcon className="h-4 w-4" /> LinkedIn
                  </button>
                  <button
                    onClick={() => setSimulatorPlatform("facebook")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                      simulatorPlatform === "facebook"
                        ? "bg-blue-600/10 border-blue-500 text-blue-400"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400"
                    }`}
                  >
                    <FacebookIcon className="h-4 w-4" /> Facebook
                  </button>
                </div>
              </div>

              {/* Prompt field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Generation Prompt</label>
                  <span className={`text-[10px] ${simulatorPrompt.length >= 1000 ? "text-rose-500 font-semibold" : "text-slate-500"}`}>
                    {simulatorPrompt.length} / 1000
                  </span>
                </div>
                <textarea
                  value={simulatorPrompt}
                  onChange={(e) => setSimulatorPrompt(e.target.value)}
                  maxLength={1000}
                  placeholder="Tell the agent what to write about..."
                  className="w-full h-24 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none resize-none transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Recurrence Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Schedule Recurrence</label>
                <div className="grid grid-cols-3 gap-2">
                  {["every 2 hours", "every 6 hours", "daily"].map((rule) => (
                    <button
                      key={rule}
                      onClick={() => setSimulatorRecurrence(rule)}
                      className={`py-2 rounded-lg border text-xs font-medium capitalize transition-all ${
                        simulatorRecurrence === rule
                          ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {rule}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Run Button */}
            <div className="pt-6 mt-6 border-t border-slate-800">
              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isSimulating ? "Generating with memory..." : "Execute Schedule Run"} <Play className="h-4 w-4 fill-current" />
              </button>
            </div>
          </div>

          {/* Visualization Output Box */}
          <div className="lg:col-span-7 bg-slate-900/20 border border-slate-900 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl">
            
            {/* Terminal Logs */}
            <div className="p-5 border-b border-slate-900 bg-slate-950/50">
              <div className="flex items-center gap-1.5 mb-3.5">
                <span className="h-3 w-3 rounded-full bg-slate-800"></span>
                <span className="h-3 w-3 rounded-full bg-slate-800"></span>
                <span className="h-3 w-3 rounded-full bg-slate-800"></span>
                <span className="text-xs font-mono text-slate-500 ml-2">agent_trace.sh</span>
              </div>
              <div className="font-mono text-xs text-slate-400 space-y-1.5 h-36 overflow-y-auto">
                {simulatorLogs.length === 0 ? (
                  <p className="text-slate-600 italic">Logs will populate here during run execution...</p>
                ) : (
                  simulatorLogs.map((log, idx) => (
                    <p key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-500">{">"}</span>
                      <span>{log}</span>
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Post Preview Output */}
            <div className="p-6 bg-slate-900/10 flex-grow flex flex-col justify-center">
              {simulatorOutput ? (
                <div className="border border-slate-800 bg-slate-950 rounded-xl p-5 shadow-lg max-w-xl mx-auto w-full animate-fade-in">
                  {/* Mock Post Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-200">PostScheduler AI Agent</span>
                        {simulatorPlatform === "linkedin" ? (
                          <LinkedinIcon className="h-3.5 w-3.5 text-blue-500" />
                        ) : (
                          <FacebookIcon className="h-3.5 w-3.5 text-blue-600" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500">Scheduled Platform Post • Just Now</span>
                    </div>
                  </div>
                  {/* Post Content */}
                  <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-sans select-all">
                    {simulatorOutput}
                  </p>
                </div>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="inline-flex h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 items-center justify-center text-slate-600">
                    <Eye className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">Post Preview Card</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Once you trigger the schedule run, the AI output preview will render here with simulated social mockups.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* How it Works / Architecture */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            The Context-Aware Posting Loop
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            How we combine LLMs and vector memory databases to protect your personal brand from repetitiveness.
          </p>
        </div>

        {/* Architecture flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-5 relative">
            <div className="absolute -top-4 left-6 h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-black text-white shadow-md shadow-blue-500/20">1</div>
            <h3 className="font-bold text-base text-slate-200 mt-2 mb-2">Prompt Trigger</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Define a general theme prompt like &quot;Write about React tips&quot; and choose scheduling parameters.
            </p>
          </div>

          <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-5 relative">
            <div className="absolute -top-4 left-6 h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-md shadow-indigo-500/20">2</div>
            <h3 className="font-bold text-base text-slate-200 mt-2 mb-2">Memory Scan</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              LangChain agents query Supermemory vector database to read previous outputs under that schedule.
            </p>
          </div>

          <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-5 relative">
            <div className="absolute -top-4 left-6 h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center text-sm font-black text-white shadow-md shadow-purple-500/20">3</div>
            <h3 className="font-bold text-base text-slate-200 mt-2 mb-2">AI Formulation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini evaluates past posts, picks an unaddressed angle, and writes a fresh social copy.
            </p>
          </div>

          <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-5 relative">
            <div className="absolute -top-4 left-6 h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-sm font-black text-white shadow-md shadow-emerald-500/20">4</div>
            <h3 className="font-bold text-base text-slate-200 mt-2 mb-2">Publish & Save</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The worker publishes to LinkedIn/Facebook and commits the new post back to Supermemory for future runs.
            </p>
          </div>

        </div>
      </section>

      {/* Features List */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900/80 scroll-mt-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Engineered for Creators
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Fully featured workspace with automated database migrations, cron workers, and sub-minute scheduling support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="bg-slate-900/20 border border-slate-900/60 p-6 rounded-2xl space-y-4 hover:border-slate-800 transition-all duration-300 group">
            <div className="inline-flex h-10 w-10 bg-indigo-500/10 rounded-xl items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Gemini-2.0-Flash Agency</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Say goodbye to generic template builders. Our agents use standard prompt formatting to draft natural, engaging platform posts.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/20 border border-slate-900/60 p-6 rounded-2xl space-y-4 hover:border-slate-800 transition-all duration-300 group">
            <div className="inline-flex h-10 w-10 bg-blue-500/10 rounded-xl items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Vector History Guard</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Integrates Supermemory vector databases to review past posts, shielding your feeds from publishing duplicate topics.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/20 border border-slate-900/60 p-6 rounded-2xl space-y-4 hover:border-slate-800 transition-all duration-300 group">
            <div className="inline-flex h-10 w-10 bg-emerald-500/10 rounded-xl items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Sub-Minute Recurrence</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Precision background workers trigger schedules based on custom timing metrics (days, hours, minutes) down to the exact minute.
            </p>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900/80 scroll-mt-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Pricing Plans
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Get started for free or unlock the full potential of AI automation with Pro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
          
          {/* Free Card */}
          <div className="bg-slate-900/20 border border-slate-900/80 p-8 rounded-2xl flex flex-col justify-between space-y-6 relative">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-300">Free Tier</h3>
              <p className="text-xs text-slate-500">Perfect for exploring the application and basic scheduling.</p>
              
              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-100">$0</span>
                <span className="text-sm text-slate-500">/ forever</span>
              </div>

              {/* List */}
              <ul className="space-y-3 pt-4 text-sm text-slate-400">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-blue-500" /> Max 1 platform connection
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-blue-500" /> Max 3 active schedules
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-blue-500" /> Basic date & time scheduling
                </li>
                <li className="flex items-center gap-2.5 text-slate-600 line-through">
                  <Lock className="h-3.5 w-3.5" /> AI Content generation agents
                </li>
                <li className="flex items-center gap-2.5 text-slate-600 line-through">
                  <Lock className="h-3.5 w-3.5" /> Supermemory duplicate protection
                </li>
              </ul>
            </div>

            <Link href="/auth/login">
              <button className="w-full py-3 rounded-xl text-sm font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors">
                Sign Up Free
              </button>
            </Link>
          </div>

          {/* Pro Card */}
          <div className="bg-slate-900/40 border-2 border-indigo-500/50 p-8 rounded-2xl flex flex-col justify-between space-y-6 relative shadow-indigo-500/5 shadow-xl">
            <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider">
              Recommended
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-indigo-400">Pro Plan</h3>
              <p className="text-xs text-slate-400 font-medium">Unleash autonomous AI posting with unlimited memory context.</p>
              
              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-100">$15</span>
                <span className="text-sm text-slate-400">/ month</span>
              </div>

              {/* List */}
              <ul className="space-y-3 pt-4 text-sm text-slate-300 font-medium">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-500" /> Unlimited platform connections
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-500" /> Unlimited active schedules
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-500" /> Gemini-2.0-Flash AI Generation
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-500" /> Supermemory duplicate protection
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-500" /> Priority cron background queue
                </li>
              </ul>
            </div>

            <Link href="/auth/login">
              <button className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300">
                Upgrade to Pro
              </button>
            </Link>
          </div>

        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900/80 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Get in Touch
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Have questions about our AI scheduling agents, Supermemory integration, or enterprise options? Drop us a line and our team will get back to you shortly.
            </p>
            <div className="pt-4 space-y-3 text-xs text-slate-500">
              <p>📍 Distributed Team (Global-first)</p>
              <p>✉️ support@post-scheduler.codernex.dev</p>
              <p>⏰ Response time: usually under 24 hours</p>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mb-20">
        <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-slate-900 p-8 sm:p-12 rounded-3xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 rounded-full blur-2xl"></div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">Ready to automate your social schedule?</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Create your account in under 30 seconds and configure your first memory-protected schedule series today.
          </p>
          <div className="pt-2">
            <Link href="/auth/login">
              <button className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-transform">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-slate-600 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <p className="font-medium text-slate-500">© 2026 PostScheduler. All rights reserved.</p>
          <p className="max-w-md mx-auto leading-relaxed">
            Designed and built for autonomous multi-platform publishing. Open-source under the Apache-2.0 License.
          </p>
          <div className="flex flex-wrap justify-center gap-6 pt-2 text-slate-500">
            <a href="https://github.com/codernex/post-scheduler" target="_blank" rel="noopener noreferrer" className="underline decoration-slate-800 hover:decoration-slate-400 hover:text-slate-300 transition-colors">GitHub Repository</a>
            <span className="text-slate-850">•</span>
            <a href="#features" className="hover:text-slate-300 underline decoration-slate-800 hover:decoration-slate-400 transition-colors">Features</a>
            <span className="text-slate-850">•</span>
            <a href="#pricing" className="hover:text-slate-300 underline decoration-slate-800 hover:decoration-slate-400 transition-colors">Pricing</a>
            <span className="text-slate-850">•</span>
            <a href="#contact" className="hover:text-slate-300 underline decoration-slate-800 hover:decoration-slate-400 transition-colors">Contact</a>
            <span className="text-slate-850">•</span>
            <Link href="/privacy" className="hover:text-slate-300 underline decoration-slate-800 hover:decoration-slate-400 transition-colors">Privacy Policy</Link>
            <span className="text-slate-850">•</span>
            <Link href="/terms" className="hover:text-slate-300 underline decoration-slate-800 hover:decoration-slate-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
