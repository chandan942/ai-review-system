from pydantic import BaseModel
from typing import List


# This defines what the user must send to the API
class CodeRequest(BaseModel):
    code: str
    language: str = "python"


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
