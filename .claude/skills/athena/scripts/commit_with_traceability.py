#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path

BLOCKED_BASENAMES = {".DS_Store"}
BLOCKED_DIR_NAMES = {"__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache"}
TEMP_SUFFIXES = (".tmp", ".temp", ".swp", ".swo", ".bak", ".orig", ".rej", "~")
DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
MAX_SECRET_SCAN_BYTES = 1024 * 1024
MAX_SECRET_SCAN_OVERLAP_BYTES = 2048
SECRET_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("private-key", re.compile(r"-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----")),
    ("aws-access-key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("github-token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b")),
    ("slack-token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b")),
    (
        "generic-secret-assignment",
        re.compile(r"""(?i)\b(api[_-]?key|secret|token|password)\b\s*[:=]\s*['"][^'"]{8,}['"]"""),
    ),
]


def _run(repo: Path, args: list[str]) -> str:
    result = subprocess.run(
        args,
        cwd=repo,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError((result.stderr or "").strip() or f"command failed: {' '.join(args)}")
    return result.stdout


def _git(repo: Path, args: list[str]) -> str:
    return _run(repo, ["git", *args])


def _git_root(repo: Path) -> Path:
    out = _git(repo, ["rev-parse", "--show-toplevel"]).strip()
    return Path(out)


def _is_git_repo(repo: Path) -> bool:
    try:
        _git(repo, ["rev-parse", "--is-inside-work-tree"])
        return True
    except Exception:
        return False


def _commit_subject(task: str, summary: str, feature: str) -> str:
    s = summary.strip().replace("\n", " ")
    return f"{task}: {s} (Feature: {feature})"


def _commit_body(feature: str, cr: str | None, decisions: str | None) -> str:
    lines: list[str] = []
    if cr:
        lines.append(f"Input: {cr}")
    if decisions:
        lines.append(f"Decisions: {decisions}")
    lines.append(f"Feature: {feature}")
    lines.append(f"Spec: docs/specs/{feature}/spec.md")
    lines.append(f"Tasks: docs/specs/{feature}/tasks.md")
    lines.append("Progress: docs/progress.txt")
    return "\n".join(lines)


def _default_stage_paths(feature: str) -> list[str]:
    return [
        f"docs/specs/{feature}/spec.md",
        f"docs/specs/{feature}/tasks.md",
        "docs/progress.txt",
        "docs/PRD.md",
        "docs/TRACEABILITY.md",
        "docs/requests.md",
        "docs/decisions.md",
    ]


def _existing_paths(repo_root: Path, paths: list[str]) -> list[str]:
    existing: list[str] = []
    for rel in paths:
        if (repo_root / rel).exists():
            existing.append(rel)
    return existing


def _is_temp_or_blocked_path(rel_path: Path) -> str | None:
    name = rel_path.name
    if name in BLOCKED_BASENAMES:
        return "blocked file pattern"
    if name == ".env" or name.startswith(".env."):
        return "blocked env file pattern"
    if name.endswith(TEMP_SUFFIXES) or name.startswith(".#"):
        return "temporary file pattern"
    if any(part in BLOCKED_DIR_NAMES for part in rel_path.parts):
        return "cache/temp directory pattern"
    return None


def _collect_candidate_paths_for_all_changes(repo_root: Path) -> list[str]:
    candidates: set[str] = set()
    commands = [
        ["diff", "--name-only", "--diff-filter=ACMRTUXB"],
        ["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"],
        ["ls-files", "--others", "--exclude-standard"],
    ]
    for cmd in commands:
        out = _git(repo_root, cmd)
        for line in out.splitlines():
            rel = line.strip()
            if rel:
                candidates.add(rel)
    return sorted(candidates)


def _scan_secrets(path: Path) -> list[str]:
    if not path.exists() or not path.is_file():
        return []
    findings: list[str] = []
    matched: set[str] = set()
    carry: bytes = b""
    with path.open("rb") as f:
        while True:
            chunk = f.read(MAX_SECRET_SCAN_BYTES)
            if not chunk:
                break
            text = (carry + chunk).decode("utf-8", errors="ignore")
            for label, pattern in SECRET_PATTERNS:
                if label in matched:
                    continue
                if pattern.search(text):
                    findings.append(label)
                    matched.add(label)
            if len(carry) < MAX_SECRET_SCAN_OVERLAP_BYTES:
                carry = (carry + chunk)[-MAX_SECRET_SCAN_OVERLAP_BYTES:]
            else:
                carry = (carry + chunk)[-MAX_SECRET_SCAN_OVERLAP_BYTES:]
    return findings


def _format_bytes(num: int) -> str:
    return f"{num / (1024 * 1024):.2f} MiB"


def _run_pre_stage_checks(repo_root: Path, candidate_paths: list[str], max_file_size_bytes: int) -> None:
    violations: list[str] = []

    for rel in candidate_paths:
        rel_path = Path(rel)
        abs_path = repo_root / rel_path

        blocked_reason = _is_temp_or_blocked_path(rel_path)
        if blocked_reason:
            violations.append(f"{rel}: {blocked_reason}")
            continue

        if not abs_path.exists() or not abs_path.is_file():
            continue

        size = abs_path.stat().st_size
        if size > max_file_size_bytes:
            violations.append(
                f"{rel}: large artifact ({_format_bytes(size)} > {_format_bytes(max_file_size_bytes)})"
            )

        findings = _scan_secrets(abs_path)
        if findings:
            violations.append(f"{rel}: potential secret pattern(s): {', '.join(findings)}")

    if violations:
        lines = [
            "pre-stage security check failed; refusing to stage.",
            "Resolve or explicitly narrow scope before committing:",
        ]
        lines.extend(f"- {entry}" for entry in violations)
        lines.append(
            "Tip: use --paths <...> for narrow staging, --docs-only for ATHENA docs only, "
            "or --skip-staging-precheck if this inclusion is intentional."
        )
        raise RuntimeError("\n".join(lines))


def _stage_changes(
    repo_root: Path,
    feature: str,
    explicit_paths: list[str] | None,
    all_changes: bool,
    docs_only: bool,
    skip_staging_precheck: bool,
    strong_operator: bool,
    max_file_size_bytes: int,
) -> str:
    if docs_only:
        candidate_paths = _default_stage_paths(feature)
        stage_paths = _existing_paths(repo_root, candidate_paths)
        if not stage_paths:
            raise RuntimeError("no stageable ATHENA docs paths found; pass --paths <...> or use --all-changes")
        if not skip_staging_precheck:
            _run_pre_stage_checks(repo_root, stage_paths, max_file_size_bytes)
        _git(repo_root, ["add", "--", *stage_paths])
        return "docs"

    stage_all = all_changes or not explicit_paths
    if stage_all:
        if not explicit_paths and not strong_operator:
            raise RuntimeError(
                "Refusing broad default staging scope without strong operator confirmation.\n"
                "Provide --paths <...> for narrow scope, --all-changes for explicit full staging, "
                "or pass --strong-operator if the broad default is intentional."
            )
        candidate_paths = _collect_candidate_paths_for_all_changes(repo_root)
        if not skip_staging_precheck:
            _run_pre_stage_checks(repo_root, candidate_paths, max_file_size_bytes)
        _git(repo_root, ["add", "-A"])
        return "all"

    if not skip_staging_precheck:
        _run_pre_stage_checks(repo_root, explicit_paths or [], max_file_size_bytes)
    _git(repo_root, ["add", "--", *(explicit_paths or [])])
    return "paths"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Stage and create a local git commit with ATHENA traceability pointers. Never pushes.",
    )
    parser.add_argument("--repo", default=".", help="Path inside the git repo (default: .).")
    parser.add_argument("--feature", required=True, help="FEATURE_ID (e.g., 20260129-peas-guardrails).")
    parser.add_argument("--task", required=True, help="Task ID (e.g., T-001).")
    parser.add_argument("--summary", required=True, help="Short summary for the commit subject.")
    parser.add_argument("--cr", help="Customer request ID (e.g., CR-YYYYMMDD-HHMM).")
    parser.add_argument("--decisions", help="Comma-separated decision IDs (e.g., D-...,D-...).")
    parser.add_argument(
        "--paths",
        nargs="+",
        help=(
            "Optional explicit paths to stage. If omitted, helper defaults to broad staging "
            "with pre-stage security checks."
        ),
    )
    parser.add_argument(
        "--all-changes",
        action="store_true",
        help="Stage all changes with git add -A (explicit).",
    )
    parser.add_argument(
        "--strong-operator",
        action="store_true",
        help=(
            "Acknowledge and authorize broad default staging (only required when --paths is omitted). "
            "Use --paths for narrow staging."
        ),
    )
    parser.add_argument(
        "--docs-only",
        action="store_true",
        help="Stage default ATHENA docs paths only (legacy path-scoped behavior).",
    )
    parser.add_argument(
        "--skip-staging-precheck",
        action="store_true",
        help="Bypass pre-stage security checks (use only when inclusion is intentional).",
    )
    parser.add_argument(
        "--max-file-size-mb",
        type=float,
        default=DEFAULT_MAX_FILE_SIZE_BYTES / (1024 * 1024),
        help="Maximum file size allowed by pre-stage checks before blocking (default: 5 MB).",
    )
    parser.add_argument(
        "--allow-empty",
        action="store_true",
        help="Allow empty commits (default: false).",
    )
    args = parser.parse_args()

    if args.paths and args.all_changes:
        raise RuntimeError("use either --paths or --all-changes, not both")
    if args.paths and args.docs_only:
        raise RuntimeError("use either --paths or --docs-only, not both")
    if args.all_changes and args.docs_only:
        raise RuntimeError("use either --all-changes or --docs-only, not both")

    repo = Path(args.repo).resolve()
    if not _is_git_repo(repo):
        raise RuntimeError("not a git repository (no commits made)")

    root = _git_root(repo)

    stage_mode = _stage_changes(
        repo_root=root,
        feature=args.feature,
        explicit_paths=args.paths,
        all_changes=args.all_changes,
        docs_only=args.docs_only,
        skip_staging_precheck=args.skip_staging_precheck,
        strong_operator=args.strong_operator,
        max_file_size_bytes=max(1, int(args.max_file_size_mb * 1024 * 1024)),
    )

    subject = _commit_subject(task=args.task, summary=args.summary, feature=args.feature)
    body = _commit_body(feature=args.feature, cr=args.cr, decisions=args.decisions)

    commit_args = ["commit", "-m", subject, "-m", body]
    if args.allow_empty:
        commit_args.insert(1, "--allow-empty")
    _git(root, commit_args)

    sha = _git(root, ["rev-parse", "HEAD"]).strip()
    print(f"[OK] Committed {sha} (staged: {stage_mode})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
