#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


@dataclass(frozen=True)
class GitCommit:
    sha: str
    date: str
    author: str
    subject: str


def _run_git(repo: Path, args: list[str]) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError((result.stderr or "").strip() or "git command failed")
    return result.stdout


def _repo_root(repo: Path) -> Path:
    out = _run_git(repo, ["rev-parse", "--show-toplevel"]).strip()
    return Path(out)


def _commit_count(repo: Path) -> int:
    out = _run_git(repo, ["rev-list", "--count", "HEAD"]).strip()
    return int(out)


def _read_commits(repo: Path, max_commits: int) -> list[GitCommit]:
    fmt = "%H%x09%ad%x09%an%x09%s"
    out = _run_git(
        repo,
        ["log", "--reverse", "--date=iso-strict", f"-n{max_commits}", f"--pretty=format:{fmt}"],
    )
    commits: list[GitCommit] = []
    for line in out.splitlines():
        parts = line.split("\t", 3)
        if len(parts) != 4:
            continue
        sha, date, author, subject = parts
        commits.append(GitCommit(sha=sha, date=date, author=author, subject=subject))
    return commits


def _to_markdown(repo_root: Path, commits: list[GitCommit], total_commits: int) -> str:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    included = len(commits)
    truncated = included < total_commits

    lines: list[str] = []
    lines.append("# Git History (Derived Audit Trail)")
    lines.append("")
    lines.append(f"Generated: {now}")
    lines.append(f"Repo: `{repo_root}`")
    if truncated:
        lines.append(f"Commits: {included} (truncated; repo has {total_commits} total)")
    else:
        lines.append(f"Commits: {included}")
    lines.append("")
    lines.append("Notes:")
    lines.append("- This file is derived from Git commit history (not verbatim customer requests).")
    lines.append("- Use this as an adoption baseline before ATHENA audit logs existed.")
    lines.append("- For details, inspect commits directly (e.g., `git show <sha>`).")
    lines.append("")
    lines.append("| Date | Commit | Author | Summary |")
    lines.append("| --- | --- | --- | --- |")
    for c in commits:
        short = c.sha[:7]
        summary = c.subject.replace("|", "\\|").strip()
        author = c.author.replace("|", "\\|").strip()
        date = c.date.replace("|", "\\|").strip()
        lines.append(f"| {date} | `{short}` | {author} | {summary} |")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate a historical audit trail markdown file from git history.",
    )
    parser.add_argument(
        "--repo",
        default=".",
        help="Path inside a git repository (default: current directory).",
    )
    parser.add_argument(
        "--out",
        default="docs/audit/git-history.md",
        help="Output markdown path (default: docs/audit/git-history.md).",
    )
    parser.add_argument(
        "--max-commits",
        type=int,
        default=500,
        help="Maximum number of commits to include (default: 500).",
    )
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    repo_root = _repo_root(repo)

    out_path = Path(args.out)
    if not out_path.is_absolute():
        out_path = (repo_root / out_path).resolve()

    total = _commit_count(repo_root)
    if total <= 0:
        raise RuntimeError("repository has no commits")

    commits = _read_commits(repo_root, max_commits=max(1, args.max_commits))
    md = _to_markdown(repo_root=repo_root, commits=commits, total_commits=total)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(md, encoding="utf-8")
    print(f"[OK] Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
