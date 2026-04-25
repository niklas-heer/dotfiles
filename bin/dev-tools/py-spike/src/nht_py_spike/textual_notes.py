from __future__ import annotations

from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Vertical
from textual.widgets import Static, TextArea


class DecisionNotesApp(App[str | None]):
    INLINE_PADDING = 0

    CSS = """
    Screen {
        background: transparent;
        color: #c0caf5;
        padding: 0;
        height: auto;
        border: none;
    }

    Screen:inline {
        height: auto;
        border: none;
    }

    Vertical {
        height: auto;
    }

    #title {
        color: $warning;
        text-style: bold;
    }

    #shell {
        height: auto;
        margin: 0 0 1 0;
        color: #a9b1d6;
    }

    #hints {
        color: #565f89;
        margin-bottom: 1;
        height: auto;
    }

    #notes {
        height: 8;
        min-height: 8;
        max-height: 8;
        color: #c0caf5;
        background: #1a1b26;
        border: round #3b4261;
        padding: 0 1;
    }
    """

    BINDINGS = [
        Binding("ctrl+s", "draft", "Draft", show=True, priority=True),
        Binding("escape", "cancel", "Cancel", show=True),
    ]

    def __init__(self, initial: str | None = None) -> None:
        super().__init__()
        self._initial = initial or ""

    def compose(self) -> ComposeResult:
        with Vertical():
            yield Static(
                "[#e0af68]nht[/] [#565f89]/[/] [bold #7aa2f7]Decision Spike[/]\n"
                "[#565f89]Capture rough notes inline. Click to place the cursor.[/]",
                id="shell",
            )
            yield Static(
                "[bold #e0af68]Ctrl+S[/] draft  "
                "[bold #e0af68]Click[/] move cursor  "
                "[bold #e0af68]Esc[/] cancel",
                id="hints",
            )
            yield TextArea(id="notes", soft_wrap=True)

    def on_mount(self) -> None:
        notes = self.query_one("#notes", TextArea)
        notes.text = self._initial
        notes.focus()

    def action_draft(self) -> None:
        notes = self.query_one("#notes", TextArea)
        self.exit(notes.text)

    def action_cancel(self) -> None:
        self.exit(None)
