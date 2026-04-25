from __future__ import annotations

import argparse
from pathlib import Path

from rich.console import Console

from .decision import DecisionReview, prompt_approval, prompt_follow_up, prompt_notes, render_review
from .llm import mock_decision_result, request_decision_result
from .models import DecisionDraft, DecisionQuestion, FollowUp
from .workflow import (
    find_nearest_readme,
    get_decision_titles,
    get_next_decision_number,
    insert_decision_entry,
)

MAX_DRAFT_ATTEMPTS = 3


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="decision-spike",
        description="Python spike for an inline nht decision workflow.",
    )
    parser.add_argument(
        "notes",
        nargs="*",
        help="Optional rough notes supplied directly on the command line.",
    )
    parser.add_argument(
        "--cwd",
        default=".",
        help="Directory to search upward from when locating README.md.",
    )
    parser.add_argument(
        "--mock",
        action="store_true",
        help="Use the built-in mock drafter instead of calling OpenRouter.",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Skip the final approval prompt and write immediately.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Render the review but do not write README.md.",
    )
    return parser


def _initial_notes(args: argparse.Namespace) -> str | None:
    cli_notes = " ".join(args.notes).strip()
    if cli_notes:
        return cli_notes

    return prompt_notes()


def _draft_decision(
    *,
    console: Console,
    notes: str,
    existing_titles: list[str],
    follow_ups: list[FollowUp],
    mock: bool,
) -> DecisionDraft | DecisionQuestion:
    with console.status("[cyan]Drafting decision...[/cyan]", spinner="dots"):
        if mock:
            return mock_decision_result(notes, follow_ups)
        return request_decision_result(notes, existing_titles, follow_ups)


def _request_draft(
    *,
    console: Console,
    notes: str,
    existing_titles: list[str],
    mock: bool,
) -> tuple[DecisionDraft, list[FollowUp]]:
    follow_ups: list[FollowUp] = []

    for _attempt in range(MAX_DRAFT_ATTEMPTS):
        result = _draft_decision(
            console=console,
            notes=notes,
            existing_titles=existing_titles,
            follow_ups=follow_ups,
            mock=mock,
        )
        if isinstance(result, DecisionDraft):
            return result, follow_ups

        answer = prompt_follow_up(result.question)
        if not answer:
            raise RuntimeError("Cancelled during follow-up.")

        follow_ups.append(FollowUp(question=result.question, answer=answer))

    raise RuntimeError("Could not draft a decision after multiple attempts.")


def main() -> int:
    parser = _build_parser()
    args = parser.parse_args()
    console = Console()

    try:
        start_dir = Path(args.cwd).resolve()
        readme_path = find_nearest_readme(start_dir)
        if readme_path is None:
            raise RuntimeError(f"Could not find README.md from {start_dir}")

        notes = _initial_notes(args)
        if not notes:
            console.print("[yellow]Cancelled.[/yellow]")
            return 0

        content = readme_path.read_text(encoding="utf-8")
        existing_titles = get_decision_titles(content)
        draft, follow_ups = _request_draft(
            console=console,
            notes=notes,
            existing_titles=existing_titles,
            mock=bool(args.mock),
        )

        number = get_next_decision_number(content)
        review = DecisionReview(
            readme_path=str(readme_path),
            number=number,
            notes=notes,
            draft=draft,
            follow_ups=follow_ups,
        )
        render_review(review)

        approved = True if args.yes else prompt_approval()
        if not approved:
            console.print("[yellow]Decision not written.[/yellow]")
            return 0

        if args.dry_run:
            console.print("[cyan]Dry run:[/cyan] README.md was not modified.")
            return 0

        next_content = insert_decision_entry(content, review.entry)
        readme_path.write_text(next_content, encoding="utf-8")
        console.print(f"[green]Decision added.[/green] {readme_path}")
        return 0
    except Exception as error:
        console.print(f"[red]{error}[/red]")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
