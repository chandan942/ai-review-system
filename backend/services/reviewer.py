from models import ReviewIssue, ReviewResponse


def mock_review(code: str, language: str) -> ReviewResponse:
    """
    Mock reviewer that returns fake review results.
    This will be replaced with real AI (Gemini/OpenAI) later.
    """
    mock_summary = "The code looks okay, but there are a few improvements needed."

    mock_issues = [
        ReviewIssue(
            line=1,
            message="Variable name is too vague",
            severity="Low",
            suggestion="Change 'x' to 'user_age'",
        ),
        ReviewIssue(
            line=5,
            message="Potential SQL Injection vulnerability",
            severity="Critical",
            suggestion="Use parameterized queries instead of f-strings",
        ),
    ]

    return ReviewResponse(summary=mock_summary, issues=mock_issues)
