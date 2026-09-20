# Setting Up GitHub Webhook for AI Review System

This document explains how to configure GitHub to send webhook events to your AI Review System instance.

## Prerequisites

1. Your AI Review System must be deployed and accessible via a public URL (e.g., on Railway, Render, etc.)
2. You must have administrative access to the GitHub repository you want to integrate with

## Step-by-Step Setup

### 1. Set Environment Variables

In your deployment environment, set these variables:

```bash
# Required for webhook security
GITHUB_WEBHOOK_SECRET=your_random_secret_here

# Required for API access (to post comments and fetch PR data)
GITHUB_TOKEN=your_github_personal_access_token_here
```

> **Note**: Never commit these values to version control. Use your platform's secret management (Railway variables, Render secrets, etc.)

### 2. Generate a GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name (e.g., "ai-review-system-webhook")
4. Select the following scopes:
   - `repo` (full control of private repositories) - OR -
   - `public_repo` (for public repositories only)
   - `admin:repo_hook` (to manage webhooks)
   - `write:discussion` (to post comments)
5. Click "Generate token"
6. **Copy the token immediately** - you won't see it again!

### 3. Create a Random Webhook Secret

Generate a strong random string (e.g., 32+ characters):

```bash
# On Linux/Mac:
openssl rand -hex 32

# Or use a password manager
```

### 4. Configure the GitHub Webhook

1. Go to your repository on GitHub → Settings → Webhooks → Add webhook
2. **Payload URL**: `https://your-deployed-domain.com/webhook/github`
   - Replace `your-deployed-domain.com` with your actual domain
   - Example: `https://ai-review-system.up.railway.app/webhook/github`
3. **Content type**: `application/json`
4. **Secret**: Paste the `GITHUB_WEBHOOK_SECRET` you generated
5. **Which events would you like to trigger this webhook?**:
   - Select "Let me select individual events"
   - Check: `Pull request`
6. Leave "Active" checked
7. Click "Add webhook"

### 5. Verify the Webhook

After adding the webhook, GitHub will send a test ping. You should see:
- A recent delivery with HTTP 200 status in the webhook details
- Logs in your AI Review System showing: `Received GitHub event: pull_request, action: opened` (or similar)

### 6. Test with a Real Pull Request

1. Create a new pull request or update an existing one in your repository
2. Wait a few seconds for the webhook to be delivered
3. Check the "Conversation" tab of the PR - you should see a comment from the AI Review System

## Troubleshooting

### Webhook Not Triggering
- Verify the webhook is active in GitHub settings
- Check that the payload URL is correct and accessible
- Ensure your deployed app is running and accepting requests

### Signature Verification Failures
- Double-check that `GITHUB_WEBHOOK_SECRET` matches exactly what you set in GitHub
- Ensure there are no extra spaces or newlines

### Permission Errors
- Verify the `GITHUB_TOKEN` has the required scopes (`repo` or `public_repo`)
- Ensure the token belongs to an account that has access to the repository

### No Comment Appears on PR
- Check your application logs for errors during webhook processing
- Verify the AI Review System can successfully review the code (test manually via `/review` endpoint)
- Ensure the PR has changes in supported file types

## Security Notes

- The webhook endpoint verifies the `X-Hub-Signature-256` header to ensure requests come from GitHub
- The GitHub token should have minimal required scopes - avoid using tokens with excessive permissions
- Consider restricting the webhook IP range to GitHub's webhook IP ranges for additional security (advanced)

## References

- GitHub Webhook Documentation: https://docs.github.com/en/developers/webhooks-and-events/webhooks
- Securing Webhooks: https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks