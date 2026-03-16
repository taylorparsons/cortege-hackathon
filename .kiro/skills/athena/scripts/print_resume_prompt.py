#!/usr/bin/env python3

import argparse
import os
import re
import sys

from progress_schema import SECTION_HEADERS, validate_progress_schema


def _read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def _first_header_value(lines: list[str], prefix: str) -> str | None:
    for line in lines:
        if line.startswith(prefix):
            return line[len(prefix) :].strip() or None
    return None


def _parse_skills_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    skills: list[str] = []
    for part in raw.split(","):
        name = part.strip()
        if not name:
            continue
        if name not in skills:
            skills.append(name)
    return skills


def _extract_skills_from_task_line(line: str) -> list[str]:
    m = re.search(r"Skills:\s*([^)]+)\)", line)
    if not m:
        return []
    return _parse_skills_list(m.group(1))


def _find_section_first_task_line(lines: list[str], section: str) -> str | None:
    try:
        start_idx = next(i for i, l in enumerate(lines) if l.strip() == section)
    except StopIteration:
        return None

    for line in lines[start_idx + 1 :]:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped in set(SECTION_HEADERS):
            return None
        if stripped.startswith("-"):
            # Skip placeholder bullets like "- (none)".
            task_text = stripped[1:].strip().lower()
            if task_text in {"(none)", "none"}:
                continue
            return stripped
    return None


def _format_skill_triggers(skills: list[str]) -> str:
    if not skills:
        return ""
    return " ".join(f"${s}" for s in skills)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate a pasteable resume prompt from docs/progress.txt (ATHENA)."
    )
    parser.add_argument(
        "--repo",
        default=".",
        help="Repo root (default: current directory).",
    )
    parser.add_argument(
        "--allow-invalid-progress",
        action="store_true",
        help="Continue and print warnings even when progress schema validation fails.",
    )
    args = parser.parse_args()

    repo_root = os.path.abspath(args.repo)
    progress_path = os.path.join(repo_root, "docs", "progress.txt")

    if not os.path.exists(progress_path):
        sys.stderr.write(f"Missing file: {progress_path}\n")
        sys.stderr.write("Expected a ATHENA progress log at docs/progress.txt.\n")
        return 2

    text = _read_text(progress_path)
    lines = text.splitlines()

    schema_errors = validate_progress_schema(lines)
    if schema_errors:
        sys.stderr.write("Progress schema validation failed:\n")
        for err in schema_errors:
            sys.stderr.write(f"- {err}\n")
        if not args.allow_invalid_progress:
            sys.stderr.write(
                "Use --allow-invalid-progress to emit a best-effort resume prompt despite schema errors.\n"
            )
            return 2

    feature = _first_header_value(lines, "Feature:") or "<unknown>"
    input_id = _first_header_value(lines, "Input:") or "<unknown>"
    header_skills = _parse_skills_list(_first_header_value(lines, "Skills:"))

    in_progress_line = _find_section_first_task_line(lines, "IN PROGRESS")
    next_line = _find_section_first_task_line(lines, "NEXT")

    active_task_line = in_progress_line or next_line
    active_task_state = "IN PROGRESS" if in_progress_line else ("NEXT" if next_line else None)

    per_task_skills = _extract_skills_from_task_line(active_task_line) if active_task_line else []
    active_skills = per_task_skills or header_skills

    print("# Paste into Codex")
    triggers = _format_skill_triggers(active_skills or ["athena"])
    print(triggers)
    print("Resume from repo state:")
    print(f"- Feature: {feature}")
    print(f"- Input: {input_id}")
    if active_task_state and active_task_line:
        print(f"- Task ({active_task_state}): {active_task_line}")
    else:
        print("- Task: <none found in docs/progress.txt>")
    if active_skills:
        print(f"Skills for current task: {', '.join(active_skills)}")
    else:
        print("Skills for current task: <unknown> (default to athena)")
    print("Continue the current task and keep docs/progress.txt updated (including Skills: tags).")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
