#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys

from progress_schema import validate_progress_schema


def _read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate docs/progress.txt against ATHENA progress schema rules."
    )
    parser.add_argument(
        "--repo",
        default=".",
        help="Repo root (default: current directory).",
    )
    args = parser.parse_args()

    repo_root = os.path.abspath(args.repo)
    progress_path = os.path.join(repo_root, "docs", "progress.txt")

    if not os.path.exists(progress_path):
        sys.stderr.write(f"Missing file: {progress_path}\n")
        return 2

    lines = _read_text(progress_path).splitlines()
    errors = validate_progress_schema(lines)
    if errors:
        print("[fail] progress schema errors:")
        for err in errors:
            print(f"- {err}")
        return 1

    print("[ok] progress schema validated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
