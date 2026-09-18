import json
import time
from typing import Optional
import httpx

from backend.config import get_settings
from backend.exceptions import ProviderError, ReviewTimeoutError
from backend.models import ReviewMetadata, ReviewResponse
from backend.services.providers.base import BaseReviewProvider
from backend.utils.prompt_builder import build_review_prompt


class OpenAIReviewProvider(BaseReviewProvider):
    """Async review provider compatible with OpenAI and OpenRouter APIs."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.openai_api_key
        self._model_name = settings.openai_model
        self.base_url = settings.openai_base_url.rstrip("/")
        self.timeout = settings.ai_timeout_seconds

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return self._model_name

    async def review_code(self, code: str, language: str, mode: str = "comprehensive") -> ReviewResponse:
        if not self.api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is missing from environment. "
                "Please configure OPENAI_API_KEY in .env file."
            )

        start_time = time.perf_counter()
        lines = code.splitlines()
        line_count = len(lines)
        prompt = build_review_prompt(code, language, mode)

        system_message = (
            "You are an AI code reviewer. Respond only with valid JSON conforming to the schema:\n"
            "{\n"
            '  "summary": "string",\n'
            '  "issues": [\n'
            "    {\n"
            '      "line": 1,\n'
            '      "message": "string",\n'
            '      "severity": "Critical" | "High" | "Medium" | "Low" | "Info",\n'
            '      "suggestion": "string",\n'
            '      "category": "string or null"\n'
            "    }\n"
            "  ]\n"
            "}"
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self._model_name,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        endpoint = f"{self.base_url}/chat/completions"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(endpoint, json=payload, headers=headers)
                if res.status_code != 200:
                    raise ProviderError(
                        provider=self.provider_name,
                        detail=f"Status {res.status_code}: {res.text}",
                    )
                data = res.json()
                content = data["choices"][0]["message"]["content"]
                raw_json = json.loads(content)
        except httpx.TimeoutException:
            raise ReviewTimeoutError(timeout_seconds=self.timeout)
        except ProviderError:
            raise
        except Exception as e:
            raise ProviderError(provider=self.provider_name, detail=str(e))

        review_time_ms = int((time.perf_counter() - start_time) * 1000)

        metadata = ReviewMetadata(
            language=language,
            mode=mode,
            lines_reviewed=line_count,
            review_time_ms=review_time_ms,
            provider=self.provider_name,
            model=self.model_name,
            cached=False,
        )

        # Build response with metadata
        return ReviewResponse(
            summary=raw_json.get("summary", "Review complete."),
            issues=raw_json.get("issues", []),
            metadata=metadata,
        )
