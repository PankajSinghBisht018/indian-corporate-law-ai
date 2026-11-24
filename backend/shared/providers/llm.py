from typing import Protocol, Optional
import ollama
import httpx
import asyncio
import re
import logging
from shared.config.settings import get_settings

logger = logging.getLogger(__name__)

class LLMProvider(Protocol):
    async def generate(self, prompt: str, timeout: int) -> Optional[str]:
        ...

class OllamaProvider:
    def __init__(self):
        self.settings = get_settings()
        self.model = self.settings.OLLAMA_MODEL
        self.client = ollama.Client(host=self.settings.OLLAMA_BASE_URL)
        self._semaphore = asyncio.Semaphore(5)

    async def _call_groq(self, prompt: str, timeout: int) -> Optional[str]:
        api_key = getattr(self.settings, "GROQ_API_KEY", "")
        if not api_key:
            return None
        model = getattr(self.settings, "GROQ_MODEL", "llama-3.3-70b-versatile")
        logger.info(f"[LLM] Calling Groq ({model}, prompt={len(prompt)} chars)...")
        try:
            async with httpx.AsyncClient(timeout=min(timeout, 45)) as client:
                res = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.15,
                        "max_tokens": 1500,
                    },
                )
            if res.status_code == 200:
                raw = res.json()["choices"][0]["message"]["content"].strip()
                logger.info(f"[LLM] Groq response received: {len(raw)} chars")
                return raw
            logger.warning(f"[LLM] Groq HTTP {res.status_code}: {res.text[:200]} — falling back to Ollama")
            return None
        except Exception as exc:
            logger.warning(f"[LLM] Groq failed ({exc}) — falling back to local Ollama")
            return None

    async def generate(self, prompt: str, timeout: int) -> Optional[str]:
        # 1. Try Groq fast cloud primary if configured
        groq_raw = await self._call_groq(prompt, timeout)
        if groq_raw:
            return groq_raw

        # 2. Fallback to local Ollama (qwen3:1.7b)
        logger.info(f"[LLM] Calling local Ollama {self.model} (timeout={timeout}s, prompt={len(prompt)} chars)...")

        def _sync():
            kwargs = dict(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                stream=False,
                format="json",
                keep_alive="15m",
                options={
                    "num_ctx":        3072,
                    "num_predict":    550,
                    "temperature":    0.15,
                    "top_k":          30,
                    "top_p":          0.90,
                    "repeat_penalty": 1.15,
                    "stop": ["Output:", "Note:", "I hope"],
                },
            )
            # Disable slow <think> reasoning tokens on Qwen3 / DeepSeek for 5x-10x faster CPU inference
            try:
                return self.client.chat(**kwargs, think=False)
            except TypeError:
                kwargs["messages"] = [{"role": "user", "content": "/no_think\n" + prompt}]
                return self.client.chat(**kwargs)

        try:
            loop = asyncio.get_event_loop()
            async with self._semaphore:
                result = await asyncio.wait_for(
                    loop.run_in_executor(None, _sync),
                    timeout=timeout,
                )
            raw = result.get("message", {}).get("content", "").strip()

            # Strip thinking blocks (Qwen3 / DeepSeek)
            raw = re.sub(r"<think>[\s\S]*?</think>", "", raw, flags=re.DOTALL).strip()
            raw = re.sub(r"<thinking>[\s\S]*?</thinking>", "", raw, flags=re.DOTALL).strip()

            # Strip markdown code fences
            raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE).strip()
            raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE).strip()

            # Strip escaped quotes
            if raw.startswith('"') and raw.endswith('"'):
                raw = raw[1:-1].replace('\\"', '"')

            logger.info(f"[LLM] Response received: {len(raw)} chars")
            return raw

        except asyncio.TimeoutError:
            logger.error(f"[TIMEOUT] LLM timed out after {timeout}s")
            return None
        except Exception as exc:
            logger.error(f"[FAIL] LLM error: {exc}", exc_info=True)
            return None
