from enum import Enum
from pydantic import BaseModel, Field, field_validator
from typing import List


class SupportedLanguage(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    GO = "go"
    RUST = "rust"
    CPP = "cpp"


# This defines what the user must send to the API
class CodeRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=10000)
    language: SupportedLanguage = Field(default=SupportedLanguage.PYTHON)

    @field_validator("code", mode="after")
    @classmethod
    def code_must_not_be_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Code is required and cannot be empty or whitespace only")
        return v


# This defines a single review issue found in the code
class ReviewIssue(BaseModel):
    line: int
    message: str
    severity: str  # "Critical", "High", "Medium", "Low"
    suggestion: str


# This defines how the review response will look
class ReviewResponse(BaseModel):
    summary: str
    issues: List[ReviewIssue]
