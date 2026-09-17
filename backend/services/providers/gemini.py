from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from google import genai
from google.genai import types

from backend.config import get_settings
from backend.models import ReviewResponse
from backend.services.providers.base import BaseReviewProvider
from backend.utils.prompt_builder import build_review_prompt


class GeminiReviewProvider(BaseReviewProvider):
    """Production Gemini AI code review provider."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.gemini_api_key
        self.model_name = settings.gemini_model
        self.timeout = settings.ai_timeout_seconds
        self._client = None

    def _get_client(self) -> genai.Client:
        if not self.api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is missing from environment. "
                "Please configure GEMINI_API_KEY in .env file or set REVIEW_PROVIDER=mock."
            )
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def review_code(self, code: str, language: str) -> ReviewResponse:
        prompt = build_review_prompt(code, language)

        def _call_gemini():
            client = self._get_client()
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ReviewResponse,
                ),
            )
            if not response.text:
                raise RuntimeError("Gemini returned an empty response.")
            return ReviewResponse.model_validate_json(response.text)

        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_call_gemini)
            try:
                return future.result(timeout=self.timeout)
            except FutureTimeoutError:
                raise RuntimeError(
                    f"AI review request timed out after {self.timeout} seconds."
                )
