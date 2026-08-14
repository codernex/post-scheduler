"""
PostingAgent
============
Uses LangChain + LangGraph + OpenRouter to generate social-media posts
and matching post images, backed by Supermemory to track what has already been posted per scheduler,
so each run covers fresh content.

Memory is keyed per scheduler_id so schedules are fully isolated.
"""

import asyncio
import logging
import random
import urllib.parse
from typing import Any, Optional, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from supermemory import Supermemory

from core import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# OpenRouter model (OpenAI-compatible) — process-level singleton
# ---------------------------------------------------------------------------
_llm = ChatOpenAI(
    openai_api_base="https://openrouter.ai/api/v1",  # type: ignore
    openai_api_key=settings.OPENROUTER_API_KEY,  # type: ignore
    model=settings.OPENROUTER_MODEL,
    temperature=0.85,
    max_tokens=350,  # type: ignore
)

# ---------------------------------------------------------------------------
# Supermemory client — process-level singleton
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

IMAGE_PROMPT_SYSTEM_PROMPT = """\
You are an expert visual artist and graphic designer for social media content.
Your task is to take a social media post and generate a detailed, highly descriptive
image generation prompt (in English, max 60 words) that describes an eye-catching visual image
matching the post topic.

Style guidelines:
- Modern visual style (sleek digital illustration, 3D render, minimalist vector artwork, or clean tech graphic)
- Clear central subject representing the post's core message or tech concept
- Vivid lighting and aesthetic composition suitable for LinkedIn / Instagram / Facebook
- Do NOT include text, letters, or words in the image description
- Output ONLY the raw image generation prompt — no preamble, quotes, or markdown.
"""


class PostingState(TypedDict):
    scheduler_id: int
    prompt: str
    platform: str
    previous_posts: str
    post_text: str
    image_prompt: str
    image_url: Optional[str]
    error: Optional[str]


class PostResult(dict):
    """
    Result container returned by PostingAgent.
    Behaves as a dict (`{"post_text": ..., "image_url": ..., "image_prompt": ...}`)
    and also seamlessly stringifies to `post_text` for backward compatibility.
    """

    def __str__(self) -> str:
        return self.get("post_text", "")

    def __repr__(self) -> str:
        return self.get("post_text", "")

    @property
    def post_text(self) -> str:
        return self.get("post_text", "")

    @property
    def image_url(self) -> Optional[str]:
        return self.get("image_url")

    @property
    def image_prompt(self) -> Optional[str]:
        return self.get("image_prompt")


# ---------------------------------------------------------------------------
# LangGraph Node Functions
# ---------------------------------------------------------------------------

async def recall_memory_node(state: PostingState) -> dict[str, Any]:
    """Node 1: Query Supermemory for past posts to avoid repetition."""
    scheduler_id = state["scheduler_id"]
    prompt = state["prompt"]
    memory_tag = f"scheduler_{scheduler_id}"

    try:
        results = _memory.search.execute(
            q=prompt,
            container_tags=[memory_tag],
            limit=10,
        )

        if not results or not results.results:
            return {"previous_posts": ""}

        entries: list[str] = []
        for i, r in enumerate(results.results, start=1):
            content = getattr(r, "memory", None) or getattr(r, "chunk", None) or ""
            if content:
                entries.append(f"Post #{i}:\n{content}")

        recalled = "\n\n---\n\n".join(entries)
        logger.info(
            "[LangGraph Node: recall_memory] Recalled %d entries for scheduler %d",
            len(entries),
            scheduler_id,
        )
        return {"previous_posts": recalled}

    except Exception as exc:
        logger.warning(
            "[LangGraph Node: recall_memory] Supermemory recall failed (scheduler_id=%d): %s",
            scheduler_id,
            exc,
        )
        return {"previous_posts": ""}


async def generate_post_node(state: PostingState) -> dict[str, Any]:
    """Node 2: Use LangChain + LLM to generate fresh social media post."""
    platform = state["platform"]
    prompt = state["prompt"]
    previous_posts = state["previous_posts"]
    scheduler_id = state["scheduler_id"]

    parts = [
        f"Platform: {platform}",
        f"Post series prompt: {prompt}",
    ]

    if previous_posts:
        parts.append(
            "Previously published posts in this series (DO NOT repeat these angles):\n\n"
            + previous_posts
        )
    else:
        parts.append("This is the FIRST post in the series — start strong!")

    parts.append(
        f"\nNow write the next {platform} post. Output ONLY the post text."
    )

    user_message_content = "\n\n".join(parts)
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_message_content),
    ]

    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            async with asyncio.timeout(20):
                response = await _llm.ainvoke(messages)
            post_text = str(response.content).strip()
            logger.info(
                "[LangGraph Node: generate_post] Post generated (%d chars) — scheduler_id=%d",
                len(post_text),
                scheduler_id,
            )
            return {"post_text": post_text}

        except TimeoutError:
            logger.error(
                "[LangGraph Node: generate_post] OpenRouter call timed out (attempt %d/%d) — scheduler_id=%d",
                attempt,
                max_retries,
                scheduler_id,
            )
            if attempt == max_retries:
                raise

        except Exception as exc:
            exc_str = str(exc)
            is_rate_limit = "429" in exc_str or "RESOURCE_EXHAUSTED" in exc_str

            if is_rate_limit and attempt < max_retries:
                wait = 2**attempt
                logger.warning(
                    "[LangGraph Node: generate_post] OpenRouter rate-limited (attempt %d/%d), retrying in %ds — scheduler_id=%d",
                    attempt,
                    max_retries,
                    wait,
                    scheduler_id,
                )
                await asyncio.sleep(wait)
            else:
                raise

    raise RuntimeError("generate_post_node: exhausted retries")


async def generate_image_node(state: PostingState) -> dict[str, Any]:
    """Node 3: Craft visual prompt and generate image matching post content."""
    post_text = state.get("post_text", "")
    scheduler_id = state.get("scheduler_id", 0)

    if not post_text:
        return {"image_prompt": "", "image_url": None}

    try:
        messages = [
            SystemMessage(content=IMAGE_PROMPT_SYSTEM_PROMPT),
            HumanMessage(
                content=f"Create an image generation prompt for this post:\n\n{post_text[:800]}"
            ),
        ]

        async with asyncio.timeout(15):
            response = await _llm.ainvoke(messages)

        image_prompt = str(response.content).strip()
        logger.info(
            "[LangGraph Node: generate_image] Image prompt generated: '%s'",
            image_prompt,
        )

        encoded_prompt = urllib.parse.quote_plus(image_prompt)
        seed = random.randint(1000, 999999)
        image_url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width=1024&height=1024&nologo=true&seed={seed}"
        )

        logger.info(
            "[LangGraph Node: generate_image] Generated image URL for scheduler_id=%d: %s",
            scheduler_id,
            image_url,
        )
        return {"image_prompt": image_prompt, "image_url": image_url}

    except Exception as exc:
        logger.warning(
            "[LangGraph Node: generate_image] Image generation failed (non-fatal, scheduler_id=%d): %s",
            scheduler_id,
            exc,
        )
        return {"image_prompt": "", "image_url": None}


# ---------------------------------------------------------------------------
# Construct LangGraph Graph
# ---------------------------------------------------------------------------

def create_posting_graph() -> Any:
    """Builds and compiles the LangGraph StateGraph pipeline."""
    graph = StateGraph(PostingState)

    graph.add_node("recall_memory", recall_memory_node)
    graph.add_node("generate_post", generate_post_node)
    graph.add_node("generate_image", generate_image_node)

    graph.add_edge(START, "recall_memory")
    graph.add_edge("recall_memory", "generate_post")
    graph.add_edge("generate_post", "generate_image")
    graph.add_edge("generate_image", END)

    return graph.compile()


# Process-level compiled graph instance
_posting_graph = create_posting_graph()


class PostingAgent:
    """
    Generates social media post content & image using a LangGraph workflow.

    Parameters
    ----------
    scheduler_id : int
        Primary key of the Scheduler row. Used as Supermemory tag.
    prompt : str | None
        User prompt defining topic / theme.
    platform : str
        Target platform name (e.g. "LinkedIn", "Instagram", "Facebook").
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

    async def generate_post(self) -> PostResult:
        """
        Executes the LangGraph pipeline:
        1. Recalls history from Supermemory.
        2. Generates fresh post content via LangChain LLM.
        3. Generates matching image prompt and image URL.

        Returns
        -------
        PostResult
            A dict-like object containing post_text, image_url, image_prompt.
            Can also be stringified directly to post_text.
        """
        logger.info(
            "[PostingAgent] Running LangGraph pipeline — scheduler_id=%d, platform=%s",
            self.scheduler_id,
            self.platform,
        )

        initial_state: PostingState = {
            "scheduler_id": self.scheduler_id,
            "prompt": self.prompt,
            "platform": self.platform,
            "previous_posts": "",
            "post_text": "",
            "image_prompt": "",
            "image_url": None,
            "error": None,
        }

        final_state: dict[str, Any] = await _posting_graph.ainvoke(initial_state)

        result = PostResult(
            post_text=final_state.get("post_text", ""),
            image_url=final_state.get("image_url"),
            image_prompt=final_state.get("image_prompt", ""),
        )

        logger.info(
            "[PostingAgent] LangGraph execution complete (post length=%d, image_url=%s) — scheduler_id=%d",
            len(result.post_text),
            result.image_url,
            self.scheduler_id,
        )
        return result

    async def save_post_to_memory(
        self, post_content: str | dict[str, Any], image_url: Optional[str] = None
    ) -> None:
        """
        Persist the generated post to Supermemory so future runs can
        recall it and avoid repetition.
        """
        if isinstance(post_content, dict):
            content_str = str(post_content.get("post_text", ""))
            image_url = image_url or post_content.get("image_url")
        else:
            content_str = str(post_content)

        metadata: dict[str, Any] = {
            "scheduler_id": self.scheduler_id,
            "platform": self.platform,
            "prompt": self.prompt,
        }
        if image_url:
            metadata["image_url"] = image_url

        try:
            _memory.add(
                content=content_str,
                container_tags=[self._memory_tag],
                metadata=metadata,
            )
            logger.info(
                "[PostingAgent] Post saved to Supermemory — tag=%s",
                self._memory_tag,
            )
        except Exception as exc:
            logger.warning(
                "[PostingAgent] Supermemory save failed (scheduler_id=%d): %s",
                self.scheduler_id,
                exc,
            )
