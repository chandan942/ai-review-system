from fastapi import APIRouter, Request, Header, HTTPException
import hmac
import hashlib
import os
import logging

from backend.services.git_service import GitHubService
from backend.services.reviewer import review_code
from backend.models import SupportedLanguage, ReviewMode

logger = logging.getLogger("webhook")

router = APIRouter()

# GitHub webhook secret from environment
GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")


def verify_signature(payload_body: bytes, signature_header: str | None) -> bool:
    """Verify that the payload was sent from GitHub by validating SHA256 signature."""
    if not GITHUB_WEBHOOK_SECRET:
        # If no secret is set, skip verification (for testing)
        logger.warning("GITHUB_WEBHOOK_SECRET not set, skipping signature verification")
        return True

    if not signature_header:
        logger.error("Missing X-Hub-Signature-256 header")
        return False

    # signature_header is expected to be like 'sha256=abcd1234...'
    try:
        sha_name, signature = signature_header.split('=')
        if sha_name != 'sha256':
            logger.error(f"Unsupported signature algorithm: {sha_name}")
            return False
    except ValueError:
        logger.error("Invalid X-Hub-Signature-256 format")
        return False

    # Compute our own HMAC
    mac = hmac.new(GITHUB_WEBHOOK_SECRET.encode(), payload_body, hashlib.sha256)
    expected_signature = mac.hexdigest()

    # Compare signatures in constant time to avoid timing attacks
    return hmac.compare_digest(expected_signature, signature)


async def get_file_language_from_path(file_path: str) -> SupportedLanguage:
    """Map file extension to SupportedLanguage enum."""
    ext = file_path.lower().split('.')[-1] if '.' in file_path else ''
    mapping = {
        'py': SupportedLanguage.PYTHON,
        'js': SupportedLanguage.JAVASCRIPT,
        'ts': SupportedLanguage.TYPESCRIPT,
        'java': SupportedLanguage.JAVA,
        'go': SupportedLanguage.GO,
        'rs': SupportedLanguage.RUST,
        'cpp': SupportedLanguage.CPP,
        'c': SupportedLanguage.C,
        'cs': SupportedLanguage.CSHARP,
        'php': SupportedLanguage.PHP,
        'rb': SupportedLanguage.RUBY,
        'kt': SupportedLanguage.KOTLIN,
    }
    return mapping.get(ext, SupportedLanguage.PYTHON)  # default to python


@router.post("/webhook/github")
async def github_webhook(request: Request, x_hub_signature_256: str | None = Header(None)):
    """Handle incoming GitHub webhook events."""
    # Get the raw body for signature verification
    payload_body = await request.body()

    # Verify the signature
    if not verify_signature(payload_body, x_hub_signature_256):
        raise HTTPException(status_code=403, detail="Invalid signature")

    # Parse the JSON payload
    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse JSON payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Log the event type and action for debugging
    event_type = request.headers.get("X-GitHub-Event")
    action = payload.get("action") if payload else None
    logger.info(f"Received GitHub event: {event_type}, action: {action}")

    # We only care about pull_request events for now
    if event_type != "pull_request":
        logger.info(f"Ignoring non-pull_request event: {event_type}")
        return {"message": "Event type not handled"}

    # Only process opened, reopened, synchronize events (when code changes)
    if action not in ["opened", "reopened", "synchronize"]:
        logger.info(f"Ignoring pull_request action: {action}")
        return {"message": "Action not handled"}

    # Extract payload data
    try:
        repo = payload["repository"]
        owner = repo["owner"]["login"]
        repo_name = repo["name"]
        pull_request = payload["pull_request"]
        pull_number = pull_request["number"]
        head_sha = pull_request["head"]["sha"]
        # We'll use the head SHA to get the file contents (the proposed changes)
        logger.info(f"Processing PR #{pull_number} from {owner}/{repo_name} at head {head_sha}")
    except KeyError as e:
        logger.error(f"Missing expected field in payload: {e}")
        return {"message": "Invalid payload structure"}

    # Initialize GitHub service
    github_svc = GitHubService()

    try:
        # Get list of changed files in the PR
        changed_files = await github_svc.get_pull_request_files(owner, repo_name, pull_number)
        logger.info(f"Found {len(changed_files)} changed files in PR #{pull_number}")

        # We'll collect review results per file
        review_results = []

        for file_info in changed_files:
            filename = file_info["filename"]
            # Skip if it's a deleted file (no content to review)
            if file_info.get("status") == "removed":
                logger.info(f"Skipping deleted file: {filename}")
                continue

            # Get the file content at the head SHA (after changes)
            try:
                content = await github_svc.get_file_content(owner, repo_name, filename, head_sha)
            except Exception as e:
                logger.warning(f"Could not fetch content for {filename}: {e}")
                continue

            # Skip empty files
            if not content.strip():
                logger.info(f"Skipping empty file: {filename}")
                continue

            # Determine language from file extension
            try:
                language = await get_file_language_from_path(filename)
            except Exception:
                language = SupportedLanguage.PYTHON  # fallback

            logger.info(f"Reviewing {filename} as {language.value}")

            # Run code review
            try:
                review_result = await review_code(
                    code=content,
                    language=language.value,
                    mode=ReviewMode.COMPREHENSIVE.value
                )
                review_results.append({
                    "filename": filename,
                    "result": review_result
                })
            except Exception as e:
                logger.error(f"Review failed for {filename}: {e}")
                continue

        # Format and post a comment on the PR
        if review_results:
            comment_body = format_pr_comment(review_results, pull_number)
            await github_svc.create_pr_comment(owner, repo_name, pull_number, comment_body)
            logger.info(f"Posted review comment on PR #{pull_number}")
        else:
            logger.info(f"No files to review for PR #{pull_number}")

        return {"message": f"Processed PR #{pull_number}", "files_reviewed": len(review_results)}

    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


def format_pr_comment(review_results: list[dict], pull_number: int) -> str:
    """Format review results into a GitHub PR comment."""
    lines = [
        f"## 🤖 AI Code Review for PR #{pull_number}",
        "",
        "This is an automated review generated by the AI Code Review System.",
        "",
        "---",
        ""
    ]

    total_issues = sum(len(r["result"].issues) for r in review_results)
    lines.append(f"**Summary:** {total_issues} issue(s) found across {len(review_results)} file(s).")
    lines.append("")

    for file_review in review_results:
        filename = file_review["filename"]
        result = file_review["result"]
        issues = result.issues

        if not issues:
            lines.append(f"### ✅ {filename}")
            lines.append("No issues found.")
            lines.append("")
            continue

        lines.append(f"### ⚠️ {filename} ({len(issues)} issue(s))")
        lines.append("")
        for issue in issues:
            severity_emoji = {
                "Critical": "🔴",
                "High": "🟠",
                "Medium": "🟡",
                "Low": "🟢",
                "Info": "🔵"
            }.get(issue.severity.value, "⚪")
            lines.append(f"- {severity_emoji} **Line {issue.line}** [{issue.severity.value}] {issue.message}")
            lines.append(f"  - *Suggestion:* {issue.suggestion}")
            if issue.category:
                lines.append(f"  - *Category:* {issue.category}")
        lines.append("")

    lines.append("---")
    lines.append("*This review was generated automatically. For false positives or questions, please consult with your team.*")
    return "\n".join(lines)