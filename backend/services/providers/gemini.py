import asyncio
import time
from google import genai
from google.genai import types

from backend.config import get_settings
from backend.exceptions import ProviderError, ReviewTimeoutError
from backend.models import ReviewMetadata, ReviewResponse
from backend.services.providers.base import BaseReviewProvider
from backend.utils.prompt_builder import build_review_prompt


class GeminiReviewProvider(BaseReviewProvider):
    """Production Gemini AI code review provider."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.gemini_api_key
        self._model_name = settings.gemini_model
        self.timeout = settings.ai_timeout_seconds
        self._client = None

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self._model_name

    def _get_client(self) -> genai.Client:
        if not self.api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is missing from environment. "
                "Please configure GEMINI_API_KEY in .env file or set REVIEW_PROVIDER=mock."
            )
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    async def review_code(self, code: str, language: str, mode: str = "comprehensive") -> ReviewResponse:
        start_time = time.perf_counter()
        lines = code.splitlines()
        line_count = len(lines)
        prompt = build_review_prompt(code, language, mode)

        def _call_gemini() -> str:
            client = self._get_client()
            response = client.models.generate_content(
                model=self._model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ReviewResponse,
                ),
            )
            if not response.text:
                raise RuntimeError("Gemini returned an empty response.")
            return response.text

        try:
            response_text = await asyncio.wait_for(
                asyncio.to_thread(_call_gemini),
                timeout=self.timeout,
            )
        except asyncio.TimeoutError:
            raise ReviewTimeoutError(timeout_seconds=self.timeout)
        except RuntimeError as e:
            raise e
        except Exception as e:
            raise ProviderError(provider=self.provider_name, detail=str(e))

        try:
            result = ReviewResponse.model_validate_json(response_text)
        except Exception as e:
            raise ProviderError(provider=self.provider_name, detail=f"Invalid response schema: {e}")

        review_time_ms = int((time.perf_counter() - start_time) * 1000)
        # Ensure accurate metadata
        result.metadata = ReviewMetadata(
            language=language,
            mode=mode,
            lines_reviewed=line_count,
            review_time_ms=review_time_ms,
            provider=self.provider_name,
            model=self.model_name,
            cached=False,
        )

        return result
