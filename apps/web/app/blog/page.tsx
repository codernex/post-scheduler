import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { POSTS } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog & Guides | PostScheduler",
  description: "Explore technical articles on building autonomous AI agents, social media post schedulers, and automating workflows with Gemini, LangChain, and Supermemory.",
  keywords: [
    "Post Scheduler Blog",
    "Social Media Automation Guides",
    "AI Agent Schedulers",
    "Tech Automation Blog"
  ]
};

export default function BlogCatalogPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600/30 pb-20">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              PostScheduler
            </span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <BookOpen className="h-3.5 w-3.5" />
            <span>PostScheduler Resources & Insights</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            The AI{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Scheduler & Agent
            </span>{" "}
            Blog
          </h1>
          <p className="text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
            Deep dives, tutorials, and engineering insights on building automation queues, LangChain orchestration, state management, and modern post scheduler techniques.
          </p>
        </div>
      </section>

      {/* Grid Catalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {POSTS.map((post) => (
            <article 
              key={post.slug}
              className="flex flex-col h-full bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden hover:border-slate-800 hover:bg-slate-900/60 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 group"
            >
              {/* Blog Header Image Placeholder / Gradient */}
              <div className="h-48 w-full bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 border-b border-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0))]" />
                <div className="absolute -top-12 -right-12 h-32 w-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
                <BookOpen className="h-12 w-12 text-blue-500/30 group-hover:text-blue-500/50 group-hover:scale-110 transition-all duration-500 relative z-10" />
              </div>

              {/* Content Body */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Meta Row */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h2>

                  {/* Excerpt */}
                  <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                {/* Footer Metadata */}
                <div className="pt-6 mt-6 border-t border-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name}
                      className="h-8 w-8 rounded-full border border-slate-800 object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-300">{post.author.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{post.author.role}</div>
                    </div>
                  </div>
                  <Link href={`/blog/${post.slug}`} className="flex items-center justify-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
