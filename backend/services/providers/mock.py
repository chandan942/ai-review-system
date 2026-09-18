import time
from backend.models import IssueSeverity, ReviewIssue, ReviewMetadata, ReviewResponse
from backend.services.providers.base import BaseReviewProvider


class MockReviewProvider(BaseReviewProvider):
    """Mock review provider for testing, offline development, and fallback."""

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return "mock-deterministic"

    async def review_code(self, code: str, language: str, mode: str = "comprehensive") -> ReviewResponse:
        start_time = time.perf_counter()
        lines = code.strip().splitlines()
        line_count = len(lines)

        issues = []
        if "eval(" in code or "exec(" in code:
            issues.append(
                ReviewIssue(
                    line=1,
                    message="Use of eval() or exec() poses severe security risks.",
                    severity=IssueSeverity.CRITICAL,
                    suggestion="Replace dynamic execution with safer alternatives like static parsing.",
                    category="Security",
                )
            )

        if line_count > 50:
            issues.append(
                ReviewIssue(
                    line=line_count,
                    message="Function or snippet is long and complex.",
                    severity=IssueSeverity.MEDIUM,
                    suggestion="Consider breaking code into smaller, single-responsibility functions.",
                    category="Maintainability",
                )
            )

        if mode == "security" and not any(i.category == "Security" for i in issues):
            summary = f"Mock security scan complete for {language} code ({line_count} lines). No security vulnerabilities identified."
        else:
            summary = (
                f"Mock analysis complete for {language} code ({line_count} lines) in '{mode}' mode. "
                + (f"Found {len(issues)} issue(s)." if issues else "No obvious issues detected.")
            )

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

        return ReviewResponse(summary=summary, issues=issues, metadata=metadata)
