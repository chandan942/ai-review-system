from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class SupportedLanguage(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    GO = "go"
    RUST = "rust"
    CPP = "cpp"
    C = "c"
    CSHARP = "csharp"
    PHP = "php"
    RUBY = "ruby"
    KOTLIN = "kotlin"


class ReviewMode(str, Enum):
    COMPREHENSIVE = "comprehensive"
    SECURITY = "security"
    PERFORMANCE = "performance"
    STYLE = "style"


class IssueSeverity(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    INFO = "Info"


# This defines what the user must send to the API
class CodeRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=15000)
    language: SupportedLanguage = Field(default=SupportedLanguage.PYTHON)
    mode: ReviewMode = Field(default=ReviewMode.COMPREHENSIVE)

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
    severity: IssueSeverity
    suggestion: str
    category: Optional[str] = None


# Rich metadata returned with every review
class ReviewMetadata(BaseModel):
    language: str
    mode: str
    lines_reviewed: int
    review_time_ms: int
    provider: str
    model: str
    cached: bool = False
    request_id: Optional[str] = None


# This defines how the review response will look
class ReviewResponse(BaseModel):
    summary: str
    issues: List[ReviewIssue]
    metadata: ReviewMetadata


# Health diagnostics schema
class HealthResponse(BaseModel):
    status: str
    provider: str
    model: str
    cache_size: int
    supported_languages: List[str]
    supported_modes: List[str]
    version: str
