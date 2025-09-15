# Python GitHub App (FastAPI) - Minimal MVP

This directory (`python_app/`) contains a minimal Python-only GitHub App server using FastAPI. It handles the `pull_request.review_requested` event and posts a reminder comment as an MVP for the "unresolved on re-review" feature.

## 1) Create your GitHub App

1. Go to GitHub → Settings → Developer settings → GitHub Apps → New GitHub App.
2. App name: `review-helper-python` (or any).
3. Homepage URL: your repo URL.
4. Webhook URL: use your public tunnel URL (see Local run below), e.g. `https://<random>.ngrok.io/webhook`.
5. Webhook secret: choose a random string; you will set it in `.env` as `GITHUB_WEBHOOK_SECRET`.
6. Permissions (minimum for MVP):
   - Pull requests: Read & write
   - Issues: Read & write (for issue comments)
   - Checks (optional if you plan to publish Check Runs later): Read & write
7. Subscribe to events:
   - Pull request
8. Create the App and generate a private key (download the `.pem`).
9. Install the App on your account/org and select repositories (or all) where you will test.

## 2) Configure environment

From `python_app/` directory:

1. Create a virtualenv and install deps
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Prepare `.env`
   - Copy `.env.example` → `.env`
   - Set `GITHUB_APP_ID` to your App ID (from the App page)
   - Base64-encode your downloaded private key PEM:
     ```bash
     base64 -i /path/to/your/private-key.pem | tr -d '\n'
     ```
     Put the result into `GITHUB_APP_PRIVATE_KEY_B64`.
   - Set `GITHUB_WEBHOOK_SECRET` to the secret you used in the App settings.

## 3) Run locally

1. Start the server:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```
2. Expose public URL (pick one):
   - ngrok: `ngrok http 8000`
   - smee.io: create a channel and run a relay to your local server
3. Update your GitHub App Webhook URL to `https://<public>/webhook`.

Health check: open `http://localhost:8000/` → `{ "status": "ok" }`.

## 4) Test the flow

1. In a repository where the App is installed, open a PR.
2. Trigger `pull_request.review_requested` by requesting a reviewer.
3. The server will verify the webhook signature, exchange the installation token, and post a reminder issue comment on the PR if prior review comments exist.

## 5) Next steps (beyond MVP)

- Use the Review Threads API to detect unresolved threads precisely and reply inline.
- Publish Check Runs with annotations.
- Add pagination for listing comments/threads.
- Add idempotency: skip posting duplicate comments per head SHA.
- Introduce a checks runner and a JSON contract (context/results) to run arbitrary Python checks.
