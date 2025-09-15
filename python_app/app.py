import base64
import hashlib
import hmac
import os
import time
from typing import Any, Dict, Optional

import httpx
import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Request
from pydantic import BaseModel


load_dotenv()

app = FastAPI(title="review-helper (python)")


# --------------------
# Config
# --------------------
APP_ID = os.getenv("GITHUB_APP_ID", "")
PRIVATE_KEY_PEM_B64 = os.getenv("GITHUB_APP_PRIVATE_KEY_B64", "")
WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET", "")

if not APP_ID:
    print("[WARN] GITHUB_APP_ID is not set")
if not PRIVATE_KEY_PEM_B64:
    print("[WARN] GITHUB_APP_PRIVATE_KEY_B64 is not set")
if not WEBHOOK_SECRET:
    print("[WARN] GITHUB_WEBHOOK_SECRET is not set")


# --------------------
# Models
# --------------------
class Installation(BaseModel):
    id: int


class Repository(BaseModel):
    name: str
    owner: Dict[str, Any]


class PullRequest(BaseModel):
    number: int
    head: Dict[str, Any]


class ReviewRequestedPayload(BaseModel):
    action: str
    installation: Installation
    repository: Repository
    pull_request: PullRequest


# --------------------
# Helpers: GitHub App Auth
# --------------------
def _get_private_key_from_b64() -> bytes:
    try:
        return base64.b64decode(PRIVATE_KEY_PEM_B64)
    except Exception as e:
        raise RuntimeError(f"Invalid base64 private key: {e}")


def create_jwt(app_id: str) -> str:
    now = int(time.time())
    payload = {
        "iat": now - 60,  # issued at
        "exp": now + 9 * 60,  # expires after 9 minutes (max 10)
        "iss": app_id,
    }
    key = _get_private_key_from_b64()
    token = jwt.encode(payload, key, algorithm="RS256")
    return token


async def get_installation_token(installation_id: int) -> str:
    jwt_token = create_jwt(APP_ID)
    url = f"https://api.github.com/app/installations/{installation_id}/access_tokens"
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {jwt_token}",
                "Accept": "application/vnd.github+json",
            },
        )
        if resp.status_code >= 300:
            raise HTTPException(status_code=500, detail=f"Failed to get installation token: {resp.text}")
        data = resp.json()
        return data["token"]


async def github_request(method: str, url: str, token: str, json_body: Optional[dict] = None):
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.request(
            method,
            url,
            headers={
                "Authorization": f"token {token}",
                "Accept": "application/vnd.github+json",
            },
            json=json_body,
        )
        return resp


# --------------------
# Webhook signature verification
# --------------------
def verify_signature(signature_256: str, body: bytes):
    if not WEBHOOK_SECRET:
        return True
    if not signature_256 or not signature_256.startswith("sha256="):
        raise HTTPException(status_code=401, detail="Missing or invalid X-Hub-Signature-256 header")
    their_sig = signature_256.split("=", 1)[1]
    mac = hmac.new(WEBHOOK_SECRET.encode("utf-8"), msg=body, digestmod=hashlib.sha256)
    our_sig = mac.hexdigest()
    if not hmac.compare_digest(their_sig, our_sig):
        raise HTTPException(status_code=401, detail="Invalid signature")
    return True


# --------------------
# Minimal unresolved-on-re-review handler
# --------------------
@app.post("/webhook")
async def webhook(
    request: Request,
    x_github_event: str = Header(None),
    x_hub_signature_256: str = Header(None),
):
    raw_body = await request.body()
    verify_signature(x_hub_signature_256, raw_body)

    payload = await request.json()
    event = x_github_event or payload.get("event")

    # Only handle pull_request and specifically review_requested
    if event != "pull_request":
        return {"ok": True, "ignored": True}

    try:
        typed = ReviewRequestedPayload(**payload)
    except Exception:
        # Not the shape we expect (e.g., synchronize); ignore in minimal MVP
        return {"ok": True, "ignored": True}

    if typed.action != "review_requested":
        return {"ok": True, "ignored": True}

    installation_id = typed.installation.id
    owner = typed.repository.owner.get("login")
    repo = typed.repository.name
    pr_number = typed.pull_request.number

    # Get installation token
    token = await get_installation_token(installation_id)

    # Fetch review threads (REST API)
    threads_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/comments?per_page=100"
    # Note: The GitHub review threads API is separate; comments list gives basic info for MVP
    resp = await github_request("GET", threads_url, token)
    if resp.status_code >= 300:
        raise HTTPException(status_code=500, detail=f"Failed to list comments: {resp.text}")
    comments = resp.json()

    # Minimal heuristic: if there are any prior reviewer comments, post a reminder comment
    if comments:
        issue_comment_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{pr_number}/comments"
        body = "Please verify that previous review comments are resolved before re-requesting review."
        post_resp = await github_request("POST", issue_comment_url, token, {"body": body})
        if post_resp.status_code >= 300:
            raise HTTPException(status_code=500, detail=f"Failed to create issue comment: {post_resp.text}")

    return {"ok": True}


@app.get("/")
async def health():
    return {"status": "ok"}
