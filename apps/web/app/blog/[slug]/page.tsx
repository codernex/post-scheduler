import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Sparkles, User, ChevronRight } from "lucide-react";
import { POSTS } from "@/lib/posts";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: `${post.title} | PostScheduler Blog`,
    description: post.excerpt,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `https://post-scheduler.codernex.dev/blog/${post.slug}`,
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    }
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600/30 pb-24">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              PostScheduler
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              All Blogs
            </Link>
            <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors border-l border-slate-800 pl-4">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-slate-300">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/blog" className="hover:text-slate-300">Blog</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-400 truncate max-w-[200px] sm:max-w-sm">{post.title}</span>
        </nav>
      </div>

      {/* Article Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <article className="space-y-8">
          {/* Blog Meta Headers */}
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight sm:leading-none">
              {post.title}
            </h1>

            {/* Author and Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-slate-900">
              <div className="flex items-center gap-3">
                <img 
                  src={post.author.avatar} 
                  alt={post.author.name}
                  className="h-10 w-10 rounded-full border border-slate-800 object-cover"
                />
                <div>
                  <div className="text-sm font-bold text-slate-200">{post.author.name}</div>
                  <div className="text-xs text-slate-500 font-medium">{post.author.role}</div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Article Render Blocks */}
          <div className="pt-4">
            {post.blocks.map((block, index) => {
              switch (block.type) {
                case "p":
                  return (
                    <p key={index} className="text-slate-300 leading-relaxed text-base sm:text-lg mb-6">
                      {block.content}
                    </p>
                  );
                case "h2":
                  return (
                    <h2 key={index} className="text-2xl sm:text-3xl font-extrabold text-white mt-12 mb-4 tracking-tight border-b border-slate-900 pb-2">
                      {block.content}
                    </h2>
                  );
                case "h3":
                  return (
                    <h3 key={index} className="text-xl sm:text-2xl font-bold text-white mt-8 mb-3 tracking-tight">
                      {block.content}
                    </h3>
                  );
                case "hr":
                  return <hr key={index} className="my-10 border-slate-900" />;
                case "list":
                  return (
                    <ul key={index} className="space-y-3 mb-6 pl-5 list-disc text-slate-300 text-base">
                      {block.items?.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {item.title && <strong className="text-white mr-1.5">{item.title}:</strong>}
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  );
                case "code":
                  return (
                    <div key={index} className="my-6 rounded-xl border border-slate-900 bg-slate-900/40 overflow-hidden font-mono text-sm leading-relaxed">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-900 bg-slate-950/60 text-xs font-semibold text-slate-500">
                        <span>{block.language || "code"}</span>
                        <span className="text-[10px] uppercase text-slate-600">Source Code</span>
                      </div>
                      <pre className="p-4 overflow-x-auto text-slate-300">
                        <code>{block.content}</code>
                      </pre>
                    </div>
                  );
                case "timeline":
                  return (
                    <div key={index} className="my-8 border border-slate-900 bg-slate-900/20 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-48 w-48 bg-indigo-500/5 rounded-full blur-3xl" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                        Sequence execution flow
                      </h4>
                      <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-8">
                        {block.steps?.map((step, idx) => (
                          <div key={idx} className="relative group/step">
                            {/* Node Dot */}
                            <div className="absolute -left-[33px] top-1.5 h-6 w-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center group-hover/step:border-blue-500 transition-colors duration-300">
                              <span className="text-[10px] font-bold text-slate-500 group-hover/step:text-blue-400">{idx + 1}</span>
                            </div>
                            {/* Step Detail Card */}
                            <div className="bg-slate-900/60 border border-slate-900/80 p-4 rounded-xl group-hover/step:border-slate-800 transition-all duration-300">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-slate-400 bg-slate-950 border border-slate-900 px-2.5 py-0.5 rounded-md">{step.from}</span>
                                <span className="text-[10px] text-slate-600">➔</span>
                                <span className="text-xs font-bold text-blue-400 bg-blue-950/20 border border-blue-900/20 px-2.5 py-0.5 rounded-md">{step.to}</span>
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed">{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                default:
                  return null;
              }
            })}
          </div>

          {/* Tags / Keywords list */}
          <div className="pt-8 border-t border-slate-900 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Topics</h5>
            <div className="flex flex-wrap gap-2">
              {post.keywords.map((tag, idx) => (
                <span key={idx} className="text-xs font-medium text-slate-400 bg-slate-900 border border-slate-850 px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
