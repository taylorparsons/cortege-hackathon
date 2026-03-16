#!/usr/bin/env python3
from __future__ import annotations

SECTION_HEADERS = ["DONE", "IN PROGRESS", "NEXT", "NOTES"]
REQUIRED_HEADERS = [
    "Session:",
    "Agent:",
    "Model:",
    "Skills:",
    "Feature:",
    "Input:",
    "Decisions:",
    "Spec:",
    "Tasks:",
    "Goal:",
]

PLACEHOLDER_TASKS = {"- (none)", "- none"}


def _find_header_lines(lines: list[str], prefix: str) -> list[int]:
    return [idx for idx, line in enumerate(lines) if line.startswith(prefix)]


def _find_section_indices(lines: list[str], section: str) -> list[int]:
    return [idx for idx, line in enumerate(lines) if line.strip() == section]


def _section_bounds(lines: list[str], section: str) -> tuple[int, int] | None:
    section_indices = _find_section_indices(lines, section)
    if len(section_indices) != 1:
        return None

    start = section_indices[0]
    end = len(lines)
    for other in SECTION_HEADERS:
        if other == section:
            continue
        for idx in _find_section_indices(lines, other):
            if idx > start:
                end = min(end, idx)
    return start, end


def _section_bullets(lines: list[str], section: str) -> list[str]:
    bounds = _section_bounds(lines, section)
    if bounds is None:
        return []

    start, end = bounds
    bullets: list[str] = []
    for raw in lines[start + 1 : end]:
        stripped = raw.strip()
        if not stripped:
            continue
        if stripped.startswith("-"):
            bullets.append(stripped)
    return bullets


def validate_progress_schema(lines: list[str]) -> list[str]:
    errors: list[str] = []

    first_section_idx = len(lines)
    for section in SECTION_HEADERS:
        indices = _find_section_indices(lines, section)
        if not indices:
            errors.append(f"missing section header `{section}`")
            continue
        if len(indices) > 1:
            errors.append(f"duplicate section header `{section}`")
        first_section_idx = min(first_section_idx, indices[0])

    section_positions = []
    for section in SECTION_HEADERS:
        indices = _find_section_indices(lines, section)
        if len(indices) == 1:
            section_positions.append((section, indices[0]))

    if len(section_positions) == len(SECTION_HEADERS):
        ordered = [name for name, _ in sorted(section_positions, key=lambda x: x[1])]
        if ordered != SECTION_HEADERS:
            errors.append(
                "section order must be: DONE -> IN PROGRESS -> NEXT -> NOTES"
            )

    for prefix in REQUIRED_HEADERS:
        header_lines = _find_header_lines(lines, prefix)
        if not header_lines:
            errors.append(f"missing required header `{prefix}`")
            continue
        if len(header_lines) > 1:
            errors.append(f"duplicate required header `{prefix}`")
        if header_lines[0] > first_section_idx:
            errors.append(f"header `{prefix}` must appear before section blocks")

    for section in SECTION_HEADERS:
        bullets = _section_bullets(lines, section)
        if not bullets:
            errors.append(f"section `{section}` must include at least one bullet")

    in_progress_bullets = _section_bullets(lines, "IN PROGRESS")
    actionable = [b for b in in_progress_bullets if b.lower() not in PLACEHOLDER_TASKS]
    if len(actionable) > 1:
        errors.append("IN PROGRESS must contain at most one actionable task")

    for bullet in actionable:
        if "Skills:" not in bullet:
            errors.append("IN PROGRESS actionable task must include `(Skills: ...)`")

    return errors
