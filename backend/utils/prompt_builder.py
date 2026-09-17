def build_review_prompt(code: str, language: str) -> str:
    """Build a structured review prompt with explicit line numbering."""
    lines = code.splitlines()
    numbered_code = "\n".join(
        f"{idx + 1:4d} | {line}" for idx, line in enumerate(lines)
    )

    return (
        "You are an expert software engineer and code reviewer.\n\n"
        f"Review the following {language} code:\n\n"
        f"```\n{numbered_code}\n```\n\n"
        "Analyze the code thoroughly for:\n"
        "- Bugs and logical errors\n"
        "- Security vulnerabilities\n"
        "- Code quality problems\n"
        "- Performance problems\n"
        "- Maintainability issues\n"
        "- Best-practice violations\n\n"
        "Instructions for reporting issues:\n"
        "- Map each issue to the exact line number shown in the left gutter above.\n"
        "- Provide a clear explanation of what is wrong.\n"
        "- Assign a severity: Low, Medium, High, or Critical.\n"
        "- Provide a practical, actionable suggestion for fixing the issue.\n"
        "- Do not report false positives or style nitpicks unless significant.\n"
        "- If the code is clean and contains no real issues, return a positive summary and an empty list of issues.\n\n"
        "Return only the requested structured review."
    )
