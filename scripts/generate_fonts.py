#!/usr/bin/env python3
"""Fetch and self-host Inter (latin subset) from Google Fonts.

Run:  python3 scripts/generate_fonts.py

Downloads a single variable-weight woff2 (weights 400-800, latin subset) plus a
matching @font-face stylesheet into public/fonts. Self-hosting removes the
render-blocking third-party Google Fonts request, drops two DNS/TLS handshakes
from the critical path, keeps the font in the PWA precache so it is right
offline, and avoids a privacy-relevant CDN call on every visit. Re-run to
refresh the font version.

The landing page uses weights 400/600/700 and the app UI adds 800; one variable
face covers the whole range in a single file, so there is nothing to keep in
sync when a new weight starts being used.
"""
import os
import re
import urllib.request

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "fonts")
# Variable-weight request → one woff2 per subset covering the whole range.
CSS_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@400..800&display=swap"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, timeout=30).read()


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    css = fetch(CSS_URL).decode()
    blocks = re.findall(r"/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{(.*?)\}", css, re.S)
    faces = []
    for subset, body in blocks:
        if subset != "latin":
            continue
        url = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
        urange = re.search(r"unicode-range:\s*([^;]+);", body).group(1).strip()
        weight = re.search(r"font-weight:\s*([\d ]+);", body).group(1).strip()
        fname = "inter-latin-var.woff2"
        with open(os.path.join(OUT_DIR, fname), "wb") as f:
            f.write(fetch(url))
        faces.append(
            "@font-face {\n"
            "  font-family: 'Inter';\n"
            "  font-style: normal;\n"
            f"  font-weight: {weight};\n"
            "  font-display: swap;\n"
            f"  src: url('/fonts/{fname}') format('woff2');\n"
            f"  unicode-range: {urange};\n"
            "}"
        )
    if not faces:
        raise SystemExit("No latin @font-face block found — Google Fonts CSS changed?")
    with open(os.path.join(OUT_DIR, "inter.css"), "w") as f:
        f.write(
            "/* Self-hosted Inter — single variable woff2 (latin subset, weights "
            "400-800).\n   Regenerate: python3 scripts/generate_fonts.py. Removes "
            "the render-blocking\n   third-party Google Fonts request. */\n"
            + "\n".join(faces)
            + "\n"
        )
    print(f"wrote {OUT_DIR}/inter-latin-var.woff2 and inter.css")


if __name__ == "__main__":
    main()
