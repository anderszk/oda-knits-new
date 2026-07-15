import json
import time
import urllib.error
import urllib.parse
import urllib.request

from fastapi import APIRouter, HTTPException, Response

from backend.config import INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_POST_LIMIT

router = APIRouter()

instagram_access_token = INSTAGRAM_ACCESS_TOKEN
instagram_post_limit = INSTAGRAM_POST_LIMIT
instagram_cache = {"expires_at": 0, "posts": []}


@router.get("/api/instagram")
def get_instagram():
    if not instagram_access_token:
        return []
    if instagram_cache["expires_at"] > time.monotonic():
        return instagram_cache["posts"]

    query = urllib.parse.urlencode({
        "fields": "id,media_type,media_url,permalink,caption,thumbnail_url,timestamp",
        "limit": max(1, min(instagram_post_limit, 12)),
        "access_token": instagram_access_token,
    })
    try:
        with urllib.request.urlopen(f"https://graph.instagram.com/me/media?{query}", timeout=6) as response:
            payload = json.load(response)
    except (OSError, urllib.error.URLError, json.JSONDecodeError):
        return instagram_cache["posts"]

    posts = []
    for item in payload.get("data", []):
        image = item.get("thumbnail_url") if item.get("media_type") == "VIDEO" else item.get("media_url")
        if image and item.get("permalink"):
            posts.append({
                "id": item.get("id"),
                "image": f"/api/instagram/image?url={urllib.parse.quote(image, safe='')}",
                "caption": item.get("caption", ""),
                "permalink": item["permalink"],
                "type": item.get("media_type", "IMAGE"),
                "timestamp": item.get("timestamp", ""),
            })
    instagram_cache.update({"expires_at": time.monotonic() + 10 * 60, "posts": posts})
    return posts


@router.get("/api/instagram/image")
def instagram_image(url: str):
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname or not parsed.hostname.endswith("cdninstagram.com"):
        raise HTTPException(status_code=400, detail="Invalid image URL")
    try:
        with urllib.request.urlopen(url, timeout=8) as image_response:
            return Response(
                content=image_response.read(),
                media_type=image_response.headers.get_content_type() or "image/jpeg",
                headers={"Cache-Control": "public, max-age=600"},
            )
    except OSError:
        raise HTTPException(status_code=502, detail="Could not load Instagram image")
