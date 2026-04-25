from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

type DecisionStatus = Literal["adopted", "deprecated", "supersedes"]


@dataclass(slots=True)
class DecisionDraft:
    title: str
    status: DecisionStatus
    decision: str
    context: str
    consequences: str
    reference: str | None = None


@dataclass(slots=True)
class DecisionQuestion:
    question: str


type DecisionResult = DecisionDraft | DecisionQuestion


@dataclass(slots=True)
class FollowUp:
    question: str
    answer: str
