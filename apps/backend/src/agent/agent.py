"""
PostingAgent
============
Uses LangChain + OpenRouter to generate social-media posts and
Supermemory to track what has already been posted per scheduler,
so each run covers fresh content.

Memory is keyed per scheduler_id so schedules are fully isolated.
"""

import asyncio
import logging
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from supermemory import Supermemory

from core import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# OpenRouter model (OpenAI-compatible) — initialised once at module level so the
# singleton is shared across all PostingAgent instances within the same process.
# ---------------------------------------------------------------------------
_llm = ChatOpenAI(
    openai_api_base="https://openrouter.ai/api/v1",
    openai_api_key=settings.OPENROUTER_API_KEY,
    model=settings.OPENROUTER_MODEL,
    temperature=0.85,       # a bit of creativity
    max_tokens=1024,
)

# ---------------------------------------------------------------------------
# Supermemory client — also a process-level singleton
# ---------------------------------------------------------------------------
_memory = Supermemory(api_key=settings.SUPERMEMORY_API_KEY)


SYSTEM_PROMPT = """\
You are an expert social-media content writer who specialises in creating
highly engaging, insightful LinkedIn posts for a technical audience.

Your writing style:
- Conversational yet authoritative
- Uses real-world analogies to explain technical concepts
- Includes a punchy opening line to stop the scroll
- Ends with a thought-provoking question or CTA to drive engagement
- Uses emojis sparingly (1-3 per post) to add personality
- No hashtag spam — max 3 focused hashtags at the end
- Target length: 150-300 words (LinkedIn sweet spot)

You will be given:
1. The topic/prompt for this post series
2. A list of previously published posts (so you don't repeat the same angle)

Your task: Write ONE new LinkedIn post that covers a FRESH angle or subtopic
not already addressed in the previous posts. Do NOT repeat ideas.
Output ONLY the post text — no preamble, no explanation.
"""


class PostingAgent:
    """
    Generates a social-media post for a given scheduler run.

    Parameters
    ----------
    scheduler_id : int
        Primary key of the Scheduler row. Used as the Supermemory tag
        to isolate memory per schedule.
    prompt : str | None
        The user's custom prompt, e.g.
        "PostgreSQL: cover indexing, VACUUM, replication, partitioning, JSONB"
        If None, falls back to a generic post request.
    platform : str
        Target platform name (e.g. "LinkedIn"). Used in the generation
        prompt so the style matches the platform.
    """

    def __init__(
        self,
        scheduler_id: int,
        prompt: Optional[str],
        platform: str = "LinkedIn",
    ) -> None:
        self.scheduler_id = scheduler_id
        self.prompt = prompt or "Write an interesting professional post"
        self.platform = platform
        self._memory_tag = f"scheduler_{scheduler_id}"

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _recall_previous_posts(self) -> str:
        """
        Query Supermemory for all past posts under this scheduler's tag.
        Returns a formatted string to inject into the generation prompt,
        or an empty string if this is the first run.
        """
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
                    entries.append(f"Post #{i}:\n{content}")

            return "\n\n---\n\n".join(entries)

        except Exception as exc:
            # Memory recall failure is non-fatal — the agent can still
            # generate a post; it just won't have history context.
            logger.warning(
                "[PostingAgent] Supermemory recall failed (scheduler_id=%d): %s",
                self.scheduler_id,
                exc,
            )
            return ""

    def _build_human_message(self, previous_posts: str) -> str:
        """Compose the user-turn message for the LLM."""
        parts = [
            f"Platform: {self.platform}",
            f"Post series prompt: {self.prompt}",
        ]

        if previous_posts:
            parts.append(
                "Previously published posts in this series (DO NOT repeat these angles):\n\n"
                + previous_posts
            )
        else:
            parts.append(
                "This is the FIRST post in the series — start strong!"
            )

        parts.append(
            f"\nNow write the next {self.platform} post. "
            "Output ONLY the post text."
        )

        return "\n\n".join(parts)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def generate_post(self) -> str:
        """
        Main entry-point called by the scheduler worker.

        1. Retrieves previously posted content from Supermemory.
        2. Builds a LangChain prompt with that context.
        3. Invokes OpenRouter to generate a fresh post (with retry + timeout).
        4. Returns the generated post text.
        """
        logger.info(
            "[PostingAgent] Generating post — scheduler_id=%d, platform=%s",
            self.scheduler_id,
            self.platform,
        )

        previous_posts = await self._recall_previous_posts()

        print(f"[PostingAgent] Previous posts: {previous_posts}")
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=self._build_human_message(previous_posts)),
        ]

        # Retry with exponential backoff for rate-limit (429) errors.
        # Total timeout capped at 90s so we never block the worker loop.
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                async with asyncio.timeout(15):
                    response = await _llm.ainvoke(messages)
                post_text: str = response.content.strip()

                logger.info(
                    "[PostingAgent] Post generated (%d chars) — scheduler_id=%d",
                    len(post_text),
                    self.scheduler_id,
                )
                return post_text

            except TimeoutError:
                logger.error(
                    "[PostingAgent] OpenRouter call timed out (attempt %d/%d) — scheduler_id=%d",
                    attempt, max_retries, self.scheduler_id,
                )
                if attempt == max_retries:
                    raise

            except Exception as exc:
                exc_str = str(exc)
                is_rate_limit = "429" in exc_str or "RESOURCE_EXHAUSTED" in exc_str

                if is_rate_limit and attempt < max_retries:
                    wait = 2 ** attempt  # 2s, 4s
                    logger.warning(
                        "[PostingAgent] OpenRouter rate-limited (attempt %d/%d), "
                        "retrying in %ds — scheduler_id=%d",
                        attempt, max_retries, wait, self.scheduler_id,
                    )
                    await asyncio.sleep(wait)
                else:
                    raise

        # Should never reach here, but satisfies the type checker
        raise RuntimeError("generate_post: exhausted retries")

    async def save_post_to_memory(self, post_content: str) -> None:
        """
        Persist the generated post to Supermemory so future runs can
        recall it and avoid repetition.
        """
        try:
            _memory.add(
                content=post_content,
                container_tags=[self._memory_tag],
                metadata={
                    "scheduler_id": self.scheduler_id,
                    "platform": self.platform,
                    "prompt": self.prompt,
                },
            )
            logger.info(
                "[PostingAgent] Post saved to Supermemory — tag=%s",
                self._memory_tag,
            )
        except Exception as exc:
            # Memory save failure is also non-fatal — the post was still
            # published; we just won't have perfect recall next time.
            logger.warning(
                "[PostingAgent] Supermemory save failed (scheduler_id=%d): %s",
                self.scheduler_id,
                exc,
            )
