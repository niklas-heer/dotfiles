from __future__ import annotations

from dataclasses import dataclass

from prompt_toolkit import HTML, PromptSession
from prompt_toolkit.application.current import get_app
from prompt_toolkit.formatted_text import FormattedText
from prompt_toolkit.key_binding import KeyBindings
from prompt_toolkit.styles import Style
from rich.columns import Columns
from rich.console import Console, ConsoleRenderable, Group
from rich.panel import Panel
from rich.rule import Rule
from rich.table import Table
from rich.text import Text
from rich.theme import Theme

from .models import DecisionDraft, FollowUp
from .textual_notes import DecisionNotesApp
from .workflow import render_decision_entry, render_status_line

TOKYO = {
    "bg": "#1e1f29",
    "bg_dark": "#1f2335",
    "bg_panel": "#24283b",
    "fg": "#c0caf5",
    "fg_soft": "#a9b1d6",
    "border": "#3b4261",
    "comment": "#565f89",
    "blue": "#7aa2f7",
    "cyan": "#7dcfff",
    "green": "#9ece6a",
    "yellow": "#e0af68",
    "purple": "#bb9af7",
}

STYLE = Style.from_dict(
    {
        "prompt": f"bold {TOKYO['yellow']}",
        "hint": TOKYO["comment"],
        "title": f"bold {TOKYO['blue']}",
        "accent": f"bold {TOKYO['cyan']}",
        "meta": TOKYO["comment"],
        "brand": f"bold {TOKYO['yellow']}",
    }
)

CONSOLE = Console(
    theme=Theme(
        {
            "tokyo.fg": TOKYO["fg"],
            "tokyo.comment": TOKYO["comment"],
            "tokyo.blue": TOKYO["blue"],
            "tokyo.cyan": TOKYO["cyan"],
            "tokyo.green": TOKYO["green"],
            "tokyo.yellow": TOKYO["yellow"],
            "tokyo.purple": TOKYO["purple"],
        }
    )
)


@dataclass(slots=True)
class DecisionReview:
    readme_path: str
    number: int
    notes: str
    draft: DecisionDraft
    follow_ups: list[FollowUp]

    @property
    def entry(self) -> str:
        return render_decision_entry(self.number, self.draft)


def _notes_toolbar() -> FormattedText:
    return FormattedText(
        [
            ("class:hint", "Ctrl-S draft"),
            ("class:hint", "  "),
            ("class:hint", "Alt-Enter newline"),
            ("class:hint", "  "),
            ("class:hint", "Ctrl-C cancel"),
        ]
    )


def _line_toolbar() -> FormattedText:
    return FormattedText(
        [
            ("class:hint", "Enter submit"),
            ("class:hint", "  "),
            ("class:hint", "Ctrl-C cancel"),
        ]
    )


def _notes_bindings() -> KeyBindings:
    bindings = KeyBindings()

    @bindings.add("c-s")
    def _submit(_event: object) -> None:
        get_app().exit(result=get_app().current_buffer.text)

    return bindings


def _print_prompt_shell(title: str, subtitle: str, border_style: str | None = None) -> None:
    header = Text()
    header.append("nht", style=f"bold {TOKYO['yellow']}")
    header.append(" / ", style=TOKYO["comment"])
    header.append(title, style=f"bold {TOKYO['blue']}")

    CONSOLE.print(
        Panel(
            Group(
                header,
                Text(subtitle, style=TOKYO["comment"]),
            ),
            border_style=border_style or TOKYO["border"],
            style=f"on {TOKYO['bg_panel']}",
            padding=(0, 1),
        )
    )


def prompt_notes(initial: str | None = None) -> str | None:
    try:
        notes = DecisionNotesApp(initial).run(inline=True)
    except KeyboardInterrupt:
        return None

    cleaned = (notes or "").strip()
    return cleaned or None


def prompt_follow_up(question: str) -> str | None:
    _print_prompt_shell(
        "Decision Follow-up",
        "One short answer should be enough to finish the draft.",
        border_style=TOKYO["cyan"],
    )
    CONSOLE.print(
        Panel(
            Text(question, style=TOKYO["fg"]),
            title="Question",
            border_style=TOKYO["border"],
            style=f"on {TOKYO['bg_panel']}",
            padding=(0, 1),
        )
    )

    session = PromptSession[str](style=STYLE)
    try:
        answer = session.prompt(
            HTML("<accent>›</accent> "),
            bottom_toolbar=_line_toolbar,
        )
    except (EOFError, KeyboardInterrupt):
        return None

    cleaned = answer.strip()
    return cleaned or None


def render_review(review: DecisionReview) -> None:
    summary = Text()
    summary.append("decision ", style=TOKYO["cyan"])
    summary.append(f"#{review.number}", style=f"bold {TOKYO['fg']}")
    summary.append("  ")
    summary.append(
        render_status_line(review.draft.status, review.draft.reference),
        style=TOKYO["green"],
    )
    summary.append("  ")
    summary.append(review.draft.title, style=f"bold {TOKYO['fg']}")

    draft_meta = Table.grid(padding=(0, 1))
    draft_meta.add_column(style=TOKYO["blue"], no_wrap=True)
    draft_meta.add_column(style=TOKYO["fg"])
    draft_meta.add_row("README", review.readme_path)
    draft_meta.add_row("Number", str(review.number))
    draft_meta.add_row("Title", review.draft.title)
    draft_meta.add_row("Status", render_status_line(review.draft.status, review.draft.reference))

    draft_panel = Panel(
        Group(
            draft_meta,
            Rule(style=TOKYO["comment"]),
            Text(review.entry, style=TOKYO["fg"]),
        ),
        title="Draft Entry",
        border_style=TOKYO["border"],
        style=f"on {TOKYO['bg_panel']}",
        padding=(1, 2),
    )

    source_group_items: list[ConsoleRenderable] = [Text(review.notes, style=TOKYO["fg"])]
    if review.follow_ups:
        follow_up_table = Table.grid(padding=(0, 1))
        follow_up_table.add_column(style=TOKYO["purple"], no_wrap=True)
        follow_up_table.add_column(style=TOKYO["fg"])
        for index, follow_up in enumerate(review.follow_ups, start=1):
            follow_up_table.add_row(f"Q{index}", follow_up.question)
            follow_up_table.add_row(f"A{index}", follow_up.answer)
        source_group_items.extend(
            [
                Rule("Follow-up Answers", style=TOKYO["comment"]),
                follow_up_table,
            ]
        )

    source_panel = Panel(
        Group(*source_group_items),
        title="Source Notes",
        border_style=TOKYO["border"],
        style=f"on {TOKYO['bg_panel']}",
        padding=(1, 2),
    )

    CONSOLE.print()
    _print_prompt_shell(
        "Decision Review",
        "Compare the drafted entry against the source notes before writing.",
    )
    CONSOLE.print(summary)
    CONSOLE.print()
    CONSOLE.print(Columns([draft_panel, source_panel], equal=True, expand=True))
    CONSOLE.print()


def prompt_approval() -> bool:
    session = PromptSession[str](style=STYLE)
    try:
        answer = session.prompt(
            HTML("<prompt>write</prompt> Update README.md with this decision? [Y/n] "),
            bottom_toolbar=_line_toolbar,
        )
    except (EOFError, KeyboardInterrupt):
        return False

    return answer.strip().lower() in {"", "y", "yes"}
