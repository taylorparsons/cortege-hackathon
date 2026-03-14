#!/usr/bin/env python3
"""Validate that the Athena skill install matches Claude Code requirements."""

from __future__ import annotations

from pathlib import Path
import re
import sys


EXPECTED_TARGETS = {
    "skills/athena": "athena",
}

FRONTMATTER_DELIM = "---"


def parse_frontmatter(skill_md: Path) -> dict[str, str]:
    text = skill_md.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines:
        raise ValueError("SKILL.md is empty")
    if lines[0].strip() != FRONTMATTER_DELIM:
        return {}

    end = None
    for idx in range(1, len(lines)):
        if lines[idx].strip() == FRONTMATTER_DELIM:
            end = idx
            break
    if end is None:
        raise ValueError("missing closing YAML frontmatter delimiter '---'")

    data: dict[str, str] = {}
    key_re = re.compile(r"^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$")
    for line in lines[1:end]:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        match = key_re.match(line)
        if not match:
            raise ValueError(f"invalid frontmatter line: {line!r}")
        key, value = match.group(1), match.group(2).strip()
        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            value = value[1:-1]
        data[key] = value
    return data


def resolve_target_dir(base_dir: Path, rel_path: str, expected_name: str) -> Path | None:
    repo_layout_target = base_dir / rel_path
    if repo_layout_target.is_dir():
        return repo_layout_target

    # Support running the validator from a directly installed skill directory.
    if base_dir.name == expected_name and (base_dir / "SKILL.md").is_file():
        return base_dir

    return None


def validate_target(base_dir: Path, rel_path: str, expected_name: str) -> list[str]:
    errors: list[str] = []
    target_dir = resolve_target_dir(base_dir, rel_path, expected_name)

    if target_dir is None:
        return [f"{rel_path}: target directory does not exist"]

    skill_files = sorted(target_dir.rglob("SKILL.md"))
    if len(skill_files) != 1:
        return [
            f"{rel_path}: expected exactly 1 SKILL.md, found {len(skill_files)}"
        ]

    top_skill = target_dir / "SKILL.md"
    if skill_files[0] != top_skill:
        errors.append(
            f"{rel_path}: SKILL.md must be at target root ({top_skill}), "
            f"found at {skill_files[0]}"
        )
        return errors

    try:
        frontmatter = parse_frontmatter(top_skill)
    except ValueError as exc:
        return [f"{rel_path}: invalid SKILL.md frontmatter: {exc}"]

    name_value = frontmatter.get("name", "")
    if name_value and name_value != expected_name:
        errors.append(
            f"{rel_path}: frontmatter name must be '{expected_name}', got '{name_value}'"
        )

    # Claude Code does not require frontmatter, but if present, keep the
    # auto-invocation description meaningful for this installed skill.
    if "description" in frontmatter and not frontmatter["description"].strip():
        errors.append(f"{rel_path}: frontmatter description must be non-empty")

    return errors


def main() -> int:
    base_dir = Path(__file__).resolve().parent.parent
    all_errors: list[str] = []

    for rel_path, expected_name in EXPECTED_TARGETS.items():
        errors = validate_target(base_dir, rel_path, expected_name)
        if errors:
            all_errors.extend(errors)
        else:
            print(f"OK: {rel_path} -> {expected_name}")

    if all_errors:
        print("Validation failed:", file=sys.stderr)
        for error in all_errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("All install targets validated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
