export interface BlogBlock {
  type: "p" | "h2" | "h3" | "code" | "list" | "timeline" | "hr";
  content?: string;
  items?: { title?: string; text: string }[]; // for list items with optional bold lead
  language?: string; // for code blocks
  steps?: { from: string; to: string; desc: string }[]; // for timeline/sequence steps
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  keywords: string[];
  blocks: BlogBlock[];
}

export const POSTS: BlogPost[] = [
  {
    slug: "building-autonomous-social-media-scheduler",
    title: "Building an Autonomous Social Media Scheduler with LangChain, Gemini, and Supermemory",
    excerpt: "Discover how we built an AI-powered posting queue using LangChain, Google Gemini, and Supermemory to automate high-quality, contextual, and non-repetitive social media posts.",
    date: "July 18, 2026",
    readTime: "6 min read",
    author: {
      name: "Codernex Team",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
      role: "Core Engineering"
    },
    keywords: [
      "Post Scheduler",
      "Social Media Scheduler",
      "AI Post Scheduler",
      "LangChain",
      "Gemini API",
      "Supermemory",
      "AI Agents",
      "Social Media Automation",
      "Background Workers",
      "FastAPI",
      "PostgreSQL",
      "Python"
    ],
    blocks: [
      {
        type: "p",
        content: "Automating social media posting is a solved problem. Tools like Buffer or Hootsuite have let us schedule raw text posts for years. But what if you don't want to manually write every single post? What if you want to provide a high-level prompt—like 'Post about PostgreSQL indexing, VACUUM, and JSONB over the next 5 days'—and let an AI handle the generation?"
      },
      {
        type: "p",
        content: "The challenge with simple LLM automation is state. If you call an LLM five times with the same prompt, it has no memory of what it wrote previously. It will hallucinate, repeat the same subtopics, and make your account look spammy."
      },
      {
        type: "p",
        content: "To solve this, we upgraded PostScheduler with an autonomous posting agent that has a long-term memory. Here is how we built it using LangChain, Google Gemini, and Supermemory."
      },
      {
        type: "hr"
      },
      {
        type: "h2",
        content: "The Architecture Behind the Engine"
      },
      {
        type: "p",
        content: "PostScheduler is built as a split stack:"
      },
      {
        type: "list",
        items: [
          { title: "Frontend", text: "Next.js (Sidebar dashboard, Radix-based precise DateTimePicker, and real-time execution queue logs)." },
          { title: "Backend", text: "FastAPI + SQLAlchemy + PostgreSQL." },
          { title: "Worker/Automation", text: "APScheduler managing background queue workers." }
        ]
      },
      {
        type: "p",
        content: "Here is how the automated queue and the AI agent orchestrate end-to-end:"
      },
      {
        type: "timeline",
        steps: [
          { from: "APScheduler Queue", to: "PostgreSQL DB", desc: "Scan for PENDING due schedules" },
          { from: "PostgreSQL DB", to: "APScheduler Queue", desc: "Return due schedules" },
          { from: "APScheduler Queue", to: "PostgreSQL DB", desc: "Claim execution & update status to 'processing'" },
          { from: "APScheduler Queue", to: "Posting Agent", desc: "Invoke generate_post(scheduler_id, prompt)" },
          { from: "Posting Agent", to: "Supermemory API", desc: "Search past memories for tag: 'scheduler_id'" },
          { from: "Supermemory API", to: "Posting Agent", desc: "Return previously published posts" },
          { from: "Posting Agent", to: "Gemini LLM", desc: "Call Gemini API (System Prompt + Prompt + Memory Context)" },
          { from: "Gemini LLM", to: "Posting Agent", desc: "Return fresh, non-repetitive post content" },
          { from: "APScheduler Queue", to: "LinkedIn API", desc: "Publish post using user OAuth tokens" },
          { from: "APScheduler Queue", to: "Supermemory API", desc: "Save successfully published post to memory tag" },
          { from: "APScheduler Queue", to: "PostgreSQL DB", desc: "Mark execution 'completed', log details, increment counters" }
        ]
      },
      {
        type: "hr"
      },
      {
        type: "h2",
        content: "Core Features"
      },
      {
        type: "list",
        items: [
          { title: "Context-Aware Memory", text: "By tagging memories with scheduler_{id}, every scheduling job has its own isolated memory context. This ensures that a post series about PostgreSQL doesn't conflict with or read memory from a post series about React." },
          { title: "Double-Loop Background Workers", text: "Worker 1 (Staging) scans for due schedules, creates atomic TaskExecution queue records, and flips statuses. Worker 2 (Execution) claims queued tasks, runs the AI agent, calls the social platform APIs, saves to Supermemory, and updates DB counters." },
          { title: "Resilient API Integration", text: "The agent is designed with exponential backoff retries and explicit timeouts (asyncio.timeout) to handle Gemini rate limits and API failures cleanly without locking up the central background worker threads." }
        ]
      },
      {
        type: "hr"
      },
      {
        type: "h2",
        content: "Deep Dive: The AI Posting Agent"
      },
      {
        type: "p",
        content: "At the heart of the posting logic is the PostingAgent class. It manages LangChain prompt construction, LLM calls, and Supermemory read/writes."
      },
      {
        type: "h3",
        content: "1. Recalling Previous Content (Long-Term Memory)"
      },
      {
        type: "p",
        content: "Before writing anything, the agent queries Supermemory to get semantic matches of what has already been posted for this scheduler. We use Supermemory because it abstracts away the complex chunking, vector database setup, and embedding pipeline."
      },
      {
        type: "code",
        language: "python",
        content: `async def _recall_previous_posts(self) -> str:
    try:
        results = _memory.search.execute(
            q=self.prompt,
            container_tags=[self._memory_tag],
            limit=10,
        )
        if not results or not results.results:
            return ""

        entries = []
        for i, r in enumerate(results.results, start=1):
            content = getattr(r, "memory", None) or getattr(r, "chunk", None) or ""
            if content:
                entries.append(f"Post #{i}:\\n{content}")
        return "\\n\\n---\\n\\n".join(entries)
    except Exception as exc:
        logger.warning("Supermemory recall failed: %s", exc)
        return ""`
      },
      {
        type: "h3",
        content: "2. Instructing Gemini"
      },
      {
        type: "p",
        content: "We use gemini-2.0-flash through LangChain. The System Prompt instructs the model on writing style (engaging opening, authoritative tone, minimal hashtags, and emojis) and explicitly asks it to pick a subtopic that does not overlap with the recalled history context."
      },
      {
        type: "code",
        language: "python",
        content: `SYSTEM_PROMPT = """
You are an expert social-media content writer who specialises in creating
highly engaging, insightful LinkedIn posts for a technical audience.

Your task: Write ONE new LinkedIn post that covers a FRESH angle or subtopic
not already addressed in the previous posts. Do NOT repeat ideas.
Output ONLY the post text — no preamble, no explanation.
"""`
      },
      {
        type: "h3",
        content: "3. Persisting the State"
      },
      {
        type: "p",
        content: "Once LinkedIn confirms the publish succeeded, we send the post to Supermemory so that the next run (e.g., 2 hours later) will recall it and pick a third topic."
      },
      {
        type: "code",
        language: "python",
        content: `async def save_post_to_memory(self, post_content: str) -> None:
    try:
        _memory.memories.add(
            content=post_content,
            container_tags=[self._memory_tag],
            metadata={
                "scheduler_id": self.scheduler_id,
                "platform": self.platform,
                "prompt": self.prompt,
            },
        )
    except Exception as exc:
        logger.warning("Supermemory save failed: %s", exc)`
      },
      {
        type: "hr"
      },
      {
        type: "h2",
        content: "Handling Errors Gracefully"
      },
      {
        type: "p",
        content: "When making external API calls in background tasks, failure is inevitable. If the Gemini API hits a rate limit or times out, we catch the exception, log it, rollback the database transaction, and reset the task in PostgreSQL back to queued."
      },
      {
        type: "p",
        content: "Furthermore, we wrapped the model calls in a retry loop with exponential backoff:"
      },
      {
        type: "code",
        language: "python",
        content: `max_retries = 3
for attempt in range(1, max_retries + 1):
    try:
        async with asyncio.timeout(15):
            response = await _llm.ainvoke(messages)
        return response.content.strip()
    except Exception as exc:
        if "429" in str(exc) and attempt < max_retries:
            wait = 2 ** attempt
            await asyncio.sleep(wait)
        else:
            raise`
      },
      {
        type: "p",
        content: "This prevents transient network errors or brief rate limits from completely crashing the scheduler run."
      },
      {
        type: "hr"
      },
      {
        type: "h2",
        content: "Conclusion"
      },
      {
        type: "p",
        content: "By combining LangChain for prompt orchestration, Google Gemini for reasoning and text generation, and Supermemory for state management, PostScheduler transforms from a simple static scheduler into a fully autonomous, context-aware writing agent."
      },
      {
        type: "p",
        content: "You can check out the full source code and deploy your own instance of the project on GitHub."
      }
    ]
  }
];
