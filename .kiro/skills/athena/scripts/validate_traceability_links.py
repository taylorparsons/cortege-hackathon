#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path

CR_RE = re.compile(r"CR-\d{8}-\d{4}")
D_RE = re.compile(r"D-\d{8}-\d{4}")
FR_RE = re.compile(r"FR-[A-Za-z0-9-]+")

FR_LINE_RE = re.compile(r"^\s*-\s*(FR-[A-Za-z0-9-]+)\s*:")
TASK_LINE_RE = re.compile(r"^\s*-\s*(?:\[[^\]]+\]\s*)?(T-\d+)\s*:")
ACCEPTANCE_RE = re.compile(r"^\s*\d+\.\s+Given\b")


class ValidationError(Exception):
    pass


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _read_ids(path: Path, prefix: str) -> set[str]:
    pattern = re.compile(rf"^##\s+({prefix}-\d{{8}}-\d{{4}})\s*$")
    ids: set[str] = set()
    for line in _read_text(path).splitlines():
        m = pattern.match(line.strip())
        if m:
            ids.add(m.group(1))
    return ids


def _extract_source_ids(text: str) -> tuple[set[str], set[str]]:
    cr_ids: set[str] = set()
    d_ids: set[str] = set()
    for match in re.finditer(r"\(Sources:\s*([^)]+)\)", text):
        block = match.group(1)
        cr_ids.update(CR_RE.findall(block))
        d_ids.update(D_RE.findall(block))
    return cr_ids, d_ids


def _collect_spec_fr_ids(spec_path: Path) -> set[str]:
    fr_ids: set[str] = set()
    for line in _read_text(spec_path).splitlines():
        m = FR_LINE_RE.match(line)
        if m:
            fr_ids.add(m.group(1))
    return fr_ids


def _validate_spec(spec_path: Path, request_ids: set[str], decision_ids: set[str]) -> list[str]:
    errors: list[str] = []
    text = _read_text(spec_path)
    lines = text.splitlines()
    fr_ids = _collect_spec_fr_ids(spec_path)

    if not fr_ids:
        errors.append(f"{spec_path}: no FR IDs found")

    for lineno, line in enumerate(lines, start=1):
        if FR_LINE_RE.match(line) and "Sources:" not in line:
            errors.append(f"{spec_path}:{lineno}: FR line missing Sources tag")

        if ACCEPTANCE_RE.match(line) and "Verifies:" not in line:
            errors.append(f"{spec_path}:{lineno}: acceptance scenario missing Verifies tag")

        if "Verifies:" in line:
            refs = FR_RE.findall(line)
            if not refs:
                errors.append(f"{spec_path}:{lineno}: Verifies tag has no FR reference")
            for fr in refs:
                if fr not in fr_ids:
                    errors.append(f"{spec_path}:{lineno}: Verifies references unknown FR `{fr}`")

    source_cr_ids, source_d_ids = _extract_source_ids(text)
    for cr_id in sorted(source_cr_ids):
        if cr_id not in request_ids:
            errors.append(f"{spec_path}: Sources references unknown request ID `{cr_id}`")
    for d_id in sorted(source_d_ids):
        if d_id not in decision_ids:
            errors.append(f"{spec_path}: Sources references unknown decision ID `{d_id}`")

    return errors


def _validate_tasks(tasks_path: Path, request_ids: set[str], decision_ids: set[str]) -> list[str]:
    errors: list[str] = []
    lines = _read_text(tasks_path).splitlines()

    spec_line = next((line for line in lines if line.startswith("Spec:")), "")
    if not spec_line:
        return [f"{tasks_path}: missing `Spec:` pointer"]

    spec_path = (tasks_path.parents[3] / spec_line.split(":", 1)[1].strip()).resolve()
    if not spec_path.exists():
        return [f"{tasks_path}: referenced spec does not exist: {spec_path}"]

    fr_ids = _collect_spec_fr_ids(spec_path)
    if not fr_ids:
        errors.append(f"{tasks_path}: referenced spec has no FR IDs: {spec_path}")

    for lineno, line in enumerate(lines, start=1):
        task_match = TASK_LINE_RE.match(line)
        if not task_match:
            continue
        if "Implements:" not in line:
            errors.append(f"{tasks_path}:{lineno}: task line missing Implements tag")
            continue

        refs = FR_RE.findall(line)
        if not refs:
            errors.append(f"{tasks_path}:{lineno}: Implements tag has no FR reference")
            continue

        for fr in refs:
            if fr not in fr_ids:
                errors.append(
                    f"{tasks_path}:{lineno}: Implements references unknown FR `{fr}` for {spec_path.name}"
                )

    text = "\n".join(lines)
    source_cr_ids, source_d_ids = _extract_source_ids(text)
    for cr_id in sorted(source_cr_ids):
        if cr_id not in request_ids:
            errors.append(f"{tasks_path}: Sources references unknown request ID `{cr_id}`")
    for d_id in sorted(source_d_ids):
        if d_id not in decision_ids:
            errors.append(f"{tasks_path}: Sources references unknown decision ID `{d_id}`")

    return errors


def _validate_prd(prd_path: Path, request_ids: set[str], decision_ids: set[str]) -> list[str]:
    errors: list[str] = []
    lines = _read_text(prd_path).splitlines()

    for lineno, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped.startswith("-"):
            continue

        if ("FR-" in stripped or "NFR-" in stripped) and "Sources:" not in stripped:
            errors.append(f"{prd_path}:{lineno}: requirement bullet missing Sources tag")

        if "Sources:" in stripped:
            cr_refs = CR_RE.findall(stripped)
            d_refs = D_RE.findall(stripped)
            if not cr_refs:
                errors.append(f"{prd_path}:{lineno}: Sources tag missing CR reference")
            for cr_id in cr_refs:
                if cr_id not in request_ids:
                    errors.append(f"{prd_path}:{lineno}: unknown request ID `{cr_id}` in Sources")
            for d_id in d_refs:
                if d_id not in decision_ids:
                    errors.append(f"{prd_path}:{lineno}: unknown decision ID `{d_id}` in Sources")

    return errors


def validate_repo(repo_root: Path) -> list[str]:
    docs_root = repo_root / "docs"
    requests_path = docs_root / "requests.md"
    decisions_path = docs_root / "decisions.md"
    prd_path = docs_root / "PRD.md"

    for required in [requests_path, decisions_path, prd_path]:
        if not required.exists():
            raise ValidationError(f"missing required file: {required}")

    request_ids = _read_ids(requests_path, "CR")
    decision_ids = _read_ids(decisions_path, "D")

    errors: list[str] = []

    spec_paths = sorted((docs_root / "specs").glob("*/spec.md"))
    tasks_paths = sorted((docs_root / "specs").glob("*/tasks.md"))

    if not spec_paths:
        errors.append(f"{docs_root / 'specs'}: no spec files found")
    if not tasks_paths:
        errors.append(f"{docs_root / 'specs'}: no tasks files found")

    errors.extend(_validate_prd(prd_path, request_ids, decision_ids))

    for path in spec_paths:
        errors.extend(_validate_spec(path, request_ids, decision_ids))

    for path in tasks_paths:
        errors.extend(_validate_tasks(path, request_ids, decision_ids))

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate ATHENA traceability links for Sources/Verifies/Implements references."
    )
    parser.add_argument("--repo", default=".", help="Repository root (default: current directory).")
    args = parser.parse_args()

    repo_root = Path(args.repo).resolve()

    try:
        errors = validate_repo(repo_root)
    except ValidationError as exc:
        print(f"[error] {exc}")
        return 2

    if errors:
        print("[fail] Traceability validation errors:")
        for err in errors:
            print(f"- {err}")
        return 1

    print("[ok] Traceability links validated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
