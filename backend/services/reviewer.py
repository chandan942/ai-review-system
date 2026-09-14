import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from backend.models import ReviewResponse


load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is missing from .env")

client = genai.Client(api_key=api_key)


def review_code(code: str, language: str) -> ReviewResponse:
    prompt = (
        "You are an expert software engineer and code reviewer.\n\n"
        f"Review the following {language} code:\n\n"
        f"{code}\n\n"
        "Analyze the code for:\n"
        "- Bugs and logical errors\n"
        "- Security vulnerabilities\n"
        "- Code quality problems\n"
        "- Performance problems\n"
        "- Maintainability issues\n"
        "- Best-practice violations\n\n"
        "For every real issue, provide:\n"
        "- The line number\n"
        "- A clear explanation\n"
        "- Severity: Low, Medium, High, or Critical\n"
        "- A practical suggestion\n\n"
        "Do not invent problems. Only report issues that are reasonably "
        "supported by the submitted code.\n\n"
        "Return only the requested structured review."
    )

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ReviewResponse,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    return ReviewResponse.model_validate_json(response.text)