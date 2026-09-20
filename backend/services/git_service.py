import os
import logging
from typing import List, Dict, Optional
import httpx

logger = logging.getLogger("git_service")

GITHUB_API_URL = "https://api.github.com"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")


class GitHubService:
    def __init__(self, token: Optional[str] = None):
        self.token = token or GITHUB_TOKEN
        if not self.token:
            logger.warning("GITHUB_TOKEN not set, GitHub API calls will fail for private repos")

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AI-Review-System"
        }
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        return headers

    async def get_pull_request_files(self, owner: str, repo: str, pull_number: int) -> List[Dict]:
        """Get the list of files in a pull request."""
        url = f"{GITHUB_API_URL}/repos/{owner}/{repo}/pulls/{pull_number}/files"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self._get_headers())
            response.raise_for_status()
            return response.json()

    async def get_file_content(self, owner: str, repo: str, path: str, ref: str) -> str:
        """Get the content of a file at a specific ref (commit, branch, etc.)."""
        url = f"{GITHUB_API_URL}/repos/{owner}/{repo}/contents/{path}"
        params = {"ref": ref}
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=self._get_headers())
            response.raise_for_status()
            data = response.json()
            if data.get("type") == "file" and data.get("encoding") == "base64":
                import base64
                return base64.b64decode(data["content"]).decode("utf-8")
            else:
                raise ValueError(f"Unexpected content type or encoding for {path}")

    async def create_pr_comment(self, owner: str, repo: str, pull_number: int, body: str) -> Dict:
        """Create a comment on a pull request."""
        url = f"{GITHUB_API_URL}/repos/{owner}/{repo}/issues/{pull_number}/comments"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={"body": body}, headers=self._get_headers())
            response.raise_for_status()
            return response.json()

    async def get_pull_request_head_sha(self, owner: str, repo: str, pull_number: int) -> str:
        """Get the head SHA of a pull request."""
        url = f"{GITHUB_API_URL}/repos/{owner}/{repo}/pulls/{pull_number}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self._get_headers())
            response.raise_for_status()
            data = response.json()
            return data["head"]["sha"]