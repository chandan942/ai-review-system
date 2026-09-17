from backend.models import ReviewIssue, ReviewResponse
from backend.services.providers.base import BaseReviewProvider


class MockReviewProvider(BaseReviewProvider):
    """Mock review provider for testing, offline development, and fallback."""

    def review_code(self, code: str, language: str) -> ReviewResponse:
        lines = code.strip().splitlines()
        line_count = len(lines)

        issues = []
        if "eval(" in code or "exec(" in code:
            issues.append(
                ReviewIssue(
                    line=1,
                    message="Use of eval() or exec() poses severe security risks.",
                    severity="Critical",
                    suggestion="Replace dynamic execution with safer alternatives like static parsing.",
                )
            )

        if line_count > 50:
            issues.append(
                ReviewIssue(
                    line=line_count,
                    message="Function or snippet is long and complex.",
                    severity="Medium",
                    suggestion="Consider breaking code into smaller, single-responsibility functions.",
                )
            )

        summary = (
            f"Mock analysis complete for {language} code ({line_count} lines). "
            + (f"Found {len(issues)} issue(s)." if issues else "No obvious issues detected.")
        )

        return ReviewResponse(summary=summary, issues=issues)
