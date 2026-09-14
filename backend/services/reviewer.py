import os

from dotenv import load_dotenv
from google import genai

from backend.models import ReviewResponse

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is missing from .env")

client = genai.Client(api_key=api_key)


def mock_review(code: str, language: str) -> ReviewResponse:
    prompt = (
        "You are an expert software engineer and code reviewer.\n\n"
        f"Review this {language} code:\n\n"
        f"{code}\n\n"
        "Find real and meaningful bugs, security vulnerabilities, "
        "code quality problems, performance problems, maintainability "
        "issues, and best-practice violations.\n\n"
        "Give a clear overall summary of the code."
    )

    response = client.models.generate_content(
    model="gemini-3.5-flash-lite",
    contents=prompt,
)

    return ReviewResponse(
        summary=response.text or "No review was returned.",
        issues=[],
    )