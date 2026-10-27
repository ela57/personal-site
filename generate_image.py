#!/usr/bin/env python3
"""Generate a PNG in assets/ using an environment-provided OpenAI API key."""

import argparse
import base64
import binascii
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import sys
from urllib import error, request
import uuid


MODEL = "gpt-image-2.5-sunburst"
ENDPOINT = "https://api.openai.com/v1/images/generations"
ASSETS = Path(__file__).resolve().parent / "assets"


class GenerationError(Exception):
    """An error safe to display without leaking credentials or API payloads."""


class NoRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Never forward the authorization header to a redirect destination.
        return None


def generate_image(prompt, api_key, *, size="1024x1024", quality="medium"):
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "n": 1,
        "size": size,
        "quality": quality,
        "output_format": "png",
    }
    req = request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with request.build_opener(NoRedirect()).open(req, timeout=300) as response:
            result = json.load(response)
    except error.HTTPError as exc:
        hints = {
            400: "Check the prompt and generation options.",
            401: "Check the OPENAI_API_KEY environment variable.",
            403: "Check project permissions and model access or organization verification.",
            404: f"Check access to the requested model ({MODEL}).",
            429: "Check API quota, billing, and rate limits.",
        }
        hint = hints.get(exc.code, "Check OpenAI service status before retrying.")
        # API error bodies can echo request details; never print them.
        raise GenerationError(f"OpenAI returned HTTP {exc.code}. {hint}") from None
    except (error.URLError, TimeoutError, OSError):
        raise GenerationError(
            "The OpenAI request failed or timed out. Check your connection. "
            "The request may have been processed; no automatic retry was made."
        ) from None
    except (ValueError, UnicodeError):
        raise GenerationError("OpenAI returned an invalid JSON response.") from None

    try:
        image = base64.b64decode(result["data"][0]["b64_json"], validate=True)
    except (KeyError, IndexError, TypeError, ValueError, binascii.Error):
        raise GenerationError("OpenAI did not return valid base64 image data.") from None
    if not image.startswith(b"\x89PNG\r\n\x1a\n"):
        raise GenerationError("OpenAI did not return the requested PNG format.")
    return image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("prompt", help="A description of the image to generate")
    parser.add_argument(
        "--output", metavar="NAME.png",
        help="Filename inside assets/ (default: a unique timestamped name)",
    )
    parser.add_argument("--size", default="1024x1024",
                        choices=("1024x1024", "1536x1024", "1024x1536", "auto"))
    parser.add_argument("--quality", default="medium",
                        choices=("low", "medium", "high", "xhigh", "max", "auto"))
    args = parser.parse_args()
    if not args.prompt.strip():
        parser.error("The prompt must not be empty.")

    name = args.output or (
        f"generated-{datetime.now(timezone.utc):%Y%m%d-%H%M%S}-{uuid.uuid4().hex[:8]}.png"
    )
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*\.png", name):
        parser.error("--output must be a simple .png filename, without directory paths.")
    destination = ASSETS / name
    if destination.exists() or destination.is_symlink():
        parser.error("That output file already exists. Choose another filename.")

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise GenerationError(
            "OPENAI_API_KEY is not set. Inject the stored secret into this "
            "process's environment before running the script."
        )
    image = generate_image(args.prompt, api_key, size=args.size, quality=args.quality)
    try:
        ASSETS.mkdir(exist_ok=True)
        # Exclusive creation protects existing assets, including symlinks.
        with destination.open("xb") as output:
            output.write(image)
    except OSError:
        raise GenerationError(
            "The image was generated but could not be saved. "
            "Check assets/ permissions and whether the filename already exists."
        ) from None
    print(f"Saved assets/{name}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except GenerationError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("Generation interrupted.", file=sys.stderr)
        sys.exit(130)
