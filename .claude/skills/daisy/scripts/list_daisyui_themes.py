#!/usr/bin/env python3
"""
List built-in DaisyUI themes from a local DaisyUI installation.

Usage:
  python3 scripts/list_daisyui_themes.py --root <repo>
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


def find_package_root(start: Path) -> Path | None:
    start = start.resolve()
    for candidate in [start] + list(start.parents):
        nm = candidate / "node_modules" / "daisyui"
        if nm.exists():
            return nm
    return None


def find_themes_file(pkg_root: Path) -> Path | None:
    candidates = [
        pkg_root / "src" / "theming" / "themes.js",
        pkg_root / "src" / "theming" / "themes.mjs",
        pkg_root / "dist" / "theming" / "themes.js",
        pkg_root / "dist" / "theming" / "themes.mjs",
        pkg_root / "theming" / "themes.js",
        pkg_root / "theming" / "themes.mjs",
    ]
    for path in candidates:
        if path.exists():
            return path
    for path in pkg_root.rglob("themes.*js"):
        if "theming" in path.parts:
            return path
    for path in pkg_root.rglob("themes.*js"):
        return path
    return None


def find_root_open(text: str) -> tuple[int | None, str | None]:
    patterns = [
        r"\bthemes\b\s*=\s*([\{\[])",
        r"export\s+default\s*([\{\[])",
        r"module\.exports\s*=\s*([\{\[])",
    ]
    for pattern in patterns:
        m = re.search(pattern, text)
        if m:
            return m.start(1), m.group(1)
    return None, None


def parse_quoted(text: str, i: int) -> tuple[str, int]:
    quote = text[i]
    i += 1
    start = i
    while i < len(text):
        ch = text[i]
        if ch == "\\":
            i += 2
            continue
        if ch == quote:
            return text[start:i], i + 1
        i += 1
    return text[start:i], i


def parse_identifier(text: str, i: int) -> tuple[str, int]:
    start = i
    i += 1
    while i < len(text) and (text[i].isalnum() or text[i] in "_$"):
        i += 1
    return text[start:i], i


def skip_ws(text: str, i: int) -> int:
    while i < len(text) and text[i].isspace():
        i += 1
    return i


def extract_keys(text: str, start_idx: int, root_char: str) -> list[str]:
    keys: list[str] = []
    brace_depth = 1 if root_char == "{" else 0
    bracket_depth = 1 if root_char == "[" else 0
    target_brace = 1
    target_bracket = 0 if root_char == "{" else 1

    i = start_idx + 1
    in_str: str | None = None
    esc = False

    while i < len(text):
        ch = text[i]

        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == in_str:
                in_str = None
            i += 1
            continue

        if ch == "/" and i + 1 < len(text):
            nxt = text[i + 1]
            if nxt == "/":
                end = text.find("\n", i + 2)
                if end == -1:
                    break
                i = end + 1
                continue
            if nxt == "*":
                end = text.find("*/", i + 2)
                if end == -1:
                    break
                i = end + 2
                continue

        if brace_depth == target_brace and bracket_depth == target_bracket:
            if ch.isspace() or ch == ",":
                i += 1
                continue
            if ch in ("\"", "'"):
                key, i = parse_quoted(text, i)
                j = skip_ws(text, i)
                if j < len(text) and text[j] == ":":
                    keys.append(key)
                i = j + 1
                continue
            if ch.isalpha() or ch in "_$":
                key, i = parse_identifier(text, i)
                j = skip_ws(text, i)
                if j < len(text) and text[j] == ":":
                    keys.append(key)
                i = j + 1
                continue

        if ch in ("\"", "'", "`"):
            in_str = ch
            i += 1
            continue
        if ch == "{":
            brace_depth += 1
            i += 1
            continue
        if ch == "}":
            brace_depth -= 1
            i += 1
            if brace_depth == 0 and bracket_depth == 0:
                break
            continue
        if ch == "[":
            bracket_depth += 1
            i += 1
            continue
        if ch == "]":
            bracket_depth -= 1
            i += 1
            if brace_depth == 0 and bracket_depth == 0:
                break
            continue

        i += 1

    return keys


def main() -> int:
    parser = argparse.ArgumentParser(description="List DaisyUI themes from local install")
    parser.add_argument("--root", default=".", help="Repo root to search for node_modules/daisyui")
    parser.add_argument("--json", action="store_true", help="Output JSON array")
    args = parser.parse_args()

    root = Path(args.root)
    pkg_root = find_package_root(root)
    if not pkg_root:
        print("Error: node_modules/daisyui not found. Install dependencies or pass --root.", file=sys.stderr)
        return 1

    themes_file = find_themes_file(pkg_root)
    if not themes_file:
        print("Error: Could not locate themes file in DaisyUI package.", file=sys.stderr)
        return 1

    text = themes_file.read_text(encoding="utf-8", errors="ignore")
    start_idx, root_char = find_root_open(text)
    if start_idx is None or root_char is None:
        print("Error: Could not find themes object/array in themes file.", file=sys.stderr)
        return 1

    keys = extract_keys(text, start_idx, root_char)
    themes = sorted(name for name in set(keys) if name.lower() != "monochrome")

    if args.json:
        print(json.dumps(themes, indent=2))
    else:
        print(f"Found {len(themes)} themes from {themes_file}")
        for name in themes:
            print(name)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
