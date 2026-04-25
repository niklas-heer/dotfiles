from __future__ import annotations

from pathlib import Path

from .models import DecisionDraft

DECISION_LOG_START = "<!-- DECISION LOG START -->"
DECISION_LOG_END = "<!-- DECISION LOG END -->"


def find_nearest_readme(start_dir: Path) -> Path | None:
    current = start_dir.resolve()

    while True:
        candidate = current / "README.md"
        if candidate.exists():
            return candidate

        if current.parent == current:
            return None

        current = current.parent


def get_next_decision_number(content: str) -> int:
    numbers: list[int] = []
    for line in content.splitlines():
        if not line.startswith("### "):
            continue

        head = line.removeprefix("### ").split(" ", 1)[0]
        if head.isdigit():
            numbers.append(int(head))

    return max(numbers, default=-1) + 1


def get_decision_titles(content: str) -> list[str]:
    titles: list[str] = []
    for line in content.splitlines():
        if not line.startswith("### "):
            continue

        parts = line.split(" ", 2)
        if len(parts) == 3 and parts[1].isdigit():
            titles.append(parts[2].strip())

    return titles


def render_status_line(status: str, reference: str | None) -> str:
    if status == "adopted":
        return "Adopted"

    if not reference:
        raise ValueError("A reference is required for deprecated or supersedes statuses.")

    if status == "deprecated":
        return f"Deprecated by [{reference}]"

    return f"Supersedes [{reference}]"


def render_decision_entry(number: int, draft: DecisionDraft) -> str:
    return "\n".join(
        [
            f"### {number} {draft.title}",
            f"* **Status**: {render_status_line(draft.status, draft.reference)}",
            f"* **Decision**: {draft.decision}",
            f"* **Context**: {draft.context}",
            f"* **Consequences**: {draft.consequences}",
        ]
    )


def insert_decision_entry(content: str, entry: str) -> str:
    start_index = content.find(DECISION_LOG_START)
    end_index = content.find(DECISION_LOG_END)

    if start_index == -1 or end_index == -1 or end_index <= start_index:
        raise ValueError("README.md is missing the decision log markers.")

    insert_index = start_index + len(DECISION_LOG_START)
    before = content[:insert_index]
    after = content[insert_index:]
    after = "\n" + after.lstrip("\n")
    return f"{before}\n\n{entry}{after}"
