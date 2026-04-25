from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from textwrap import shorten
from typing import Any, cast
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .models import DecisionDraft, DecisionQuestion, DecisionResult, DecisionStatus, FollowUp

MODEL = "openai/gpt-5.4-mini"
_ENV_LOAD_FAILURE: str | None = None


def _tool_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _varlock_bin(tool_root: Path) -> Path:
    return tool_root / "node_modules" / ".bin" / "varlock"


def _varlock_entry_path(tool_root: Path) -> Path:
    deployed = tool_root / ".env.schema"
    if deployed.exists():
        return deployed

    source = tool_root / "dot_env.schema"
    if source.exists():
        return source

    return tool_root


def _summarize_varlock_error(message: str) -> str:
    for line in message.splitlines():
        stripped = line.strip()
        if "error resolving value:" in stripped:
            return stripped.split("error resolving value:", 1)[1].strip()

    collapsed = " ".join(part.strip() for part in message.splitlines() if part.strip())
    return collapsed[:240]


def _extract_varlock_value(value: object) -> str | None:
    if isinstance(value, str):
        return value

    if isinstance(value, dict):
        payload = cast(dict[str, Any], value)
        resolved = payload.get("resolvedValue")
        if isinstance(resolved, str):
            return resolved

    return None


def ensure_env_loaded() -> None:
    global _ENV_LOAD_FAILURE

    if os.environ.get("OPENROUTER_API_KEY", "").strip():
        _ENV_LOAD_FAILURE = None
        return

    tool_root = _tool_root()
    varlock_bin = _varlock_bin(tool_root)
    entry_path = _varlock_entry_path(tool_root)

    if not varlock_bin.exists():
        _ENV_LOAD_FAILURE = f"varlock was not found at {varlock_bin}."
        return

    try:
        result = subprocess.run(
            [
                str(varlock_bin),
                "load",
                "--path",
                str(entry_path),
                "--format",
                "json",
            ],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as error:
        message = error.stderr.strip() or error.stdout.strip() or str(error)
        summary = _summarize_varlock_error(message)
        _ENV_LOAD_FAILURE = f"varlock could not resolve OPENROUTER_API_KEY: {summary}"
        return

    payload = result.stdout.strip()
    if not payload:
        _ENV_LOAD_FAILURE = "varlock returned no environment payload."
        return

    try:
        loaded = json.loads(payload)
    except json.JSONDecodeError as error:
        _ENV_LOAD_FAILURE = f"Could not parse varlock environment payload: {error}"
        return

    if not isinstance(loaded, dict):
        _ENV_LOAD_FAILURE = "Unexpected varlock payload shape."
        return

    for key, value in loaded.items():
        resolved = _extract_varlock_value(value)
        if resolved is not None:
            os.environ.setdefault(key, resolved)

    if os.environ.get("OPENROUTER_API_KEY", "").strip():
        _ENV_LOAD_FAILURE = None
    else:
        _ENV_LOAD_FAILURE = (
            "varlock ran successfully but did not populate OPENROUTER_API_KEY."
        )


def _api_key() -> str:
    ensure_env_loaded()
    key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not key:
        details = ["OPENROUTER_API_KEY is required."]
        if _ENV_LOAD_FAILURE:
            details.append(_ENV_LOAD_FAILURE)
        details.append(
            "Set OPENROUTER_API_KEY in your shell or make sure your "
            "1Password/varlock setup is available."
        )
        raise RuntimeError(" ".join(details))
    return key


def _system_prompt() -> str:
    return "\n".join(
        [
            (
                "You turn rough developer notes into polished decision log entries "
                "for a dotfiles repository."
            ),
            "Return a single JSON object and nothing else.",
            (
                "Set needs_follow_up to true only if one short question is required "
                "to draft a good decision entry."
            ),
            "Every key must always be present in the returned object.",
            "Use null for fields that are not applicable in the current branch.",
            (
                "If needs_follow_up is true, fill question and set title, status, "
                "reference, decision, context, and consequences to null."
            ),
            (
                "If needs_follow_up is false, fill title, status, decision, "
                "context, and consequences and set question to null."
            ),
            (
                "Default to adopted unless the notes clearly describe replacing "
                "or deprecating another decision."
            ),
            (
                "If status is deprecated or supersedes, include the referenced "
                "prior decision in reference; otherwise set reference to null."
            ),
            "Write in first person singular.",
            "Keep title concise and decision-oriented.",
            (
                "Write decision, context, and consequences as polished prose, "
                "each one to three sentences."
            ),
            "Do not use markdown headings or bullets inside the fields.",
            "Do not mention that an AI wrote the content.",
            (
                "Required JSON shape: "
                '{"needs_follow_up": boolean, "question": string|null, "title": string|null, '
                '"status": "adopted"|"deprecated"|"supersedes"|null, "reference": string|null, '
                '"decision": string|null, "context": string|null, "consequences": string|null}'
            ),
        ]
    )


def _user_prompt(notes: str, existing_titles: list[str], follow_ups: list[FollowUp]) -> str:
    sections = [
        "Current decision titles:",
        "\n".join(f"- {title}" for title in existing_titles) if existing_titles else "- none",
        "",
        "Rough notes:",
        notes,
    ]
    if follow_ups:
        sections.extend(
            [
                "",
                "Follow-up answers:",
                "\n\n".join(f"Q: {item.question}\nA: {item.answer}" for item in follow_ups),
            ]
        )

    return "\n".join(sections)


def _extract_text_content(content: object) -> str:
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        chunks: list[str] = []
        for item in content:
            if isinstance(item, dict):
                item_dict = cast(dict[str, Any], item)
                text = item_dict.get("text")
                if isinstance(text, str):
                    chunks.append(text)
        if chunks:
            return "".join(chunks)

    raise RuntimeError("Provider returned an unexpected message content shape.")


def _request_json(system_prompt: str, user_prompt: str) -> dict[str, object]:
    body = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }
    request = Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {_api_key()}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/niklas-heer/dotfiles",
            "X-Title": "nht dev-tools py spike",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=90) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Provider returned error: status {error.code}: {detail}") from error
    except URLError as error:
        raise RuntimeError(f"Provider request failed: {error}") from error

    try:
        content = payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as error:
        raise RuntimeError("Provider response did not include a usable message.") from error

    text = _extract_text_content(content)
    try:
        result = json.loads(text)
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Provider returned invalid JSON: {text}") from error

    if not isinstance(result, dict):
        raise RuntimeError("Provider returned a non-object JSON value.")

    return result


def _clean_sentence(value: str) -> str:
    return " ".join(value.strip().split())


def _to_decision_result(payload: dict[str, object]) -> DecisionResult:
    needs_follow_up = payload.get("needs_follow_up")
    if not isinstance(needs_follow_up, bool):
        raise RuntimeError("Provider JSON is missing a boolean needs_follow_up field.")

    if needs_follow_up:
        question = payload.get("question")
        if not isinstance(question, str) or not question.strip():
            raise RuntimeError("Provider requested a follow-up without a usable question.")
        return DecisionQuestion(question=question.strip())

    title = payload.get("title")
    status = payload.get("status")
    decision = payload.get("decision")
    context = payload.get("context")
    consequences = payload.get("consequences")
    reference = payload.get("reference")

    if not isinstance(title, str) or not title.strip():
        raise RuntimeError("Provider draft is missing a title.")
    if status not in {"adopted", "deprecated", "supersedes"}:
        raise RuntimeError("Provider draft has an invalid status.")
    status_value = cast(DecisionStatus, status)
    if not isinstance(decision, str) or not decision.strip():
        raise RuntimeError("Provider draft is missing the decision field.")
    if not isinstance(context, str) or not context.strip():
        raise RuntimeError("Provider draft is missing the context field.")
    if not isinstance(consequences, str) or not consequences.strip():
        raise RuntimeError("Provider draft is missing the consequences field.")
    if reference is not None and not isinstance(reference, str):
        raise RuntimeError("Provider draft has an invalid reference field.")

    return DecisionDraft(
        title=_clean_sentence(title),
        status=status_value,
        reference=reference.strip() or None if isinstance(reference, str) else None,
        decision=_clean_sentence(decision),
        context=_clean_sentence(context),
        consequences=_clean_sentence(consequences),
    )


def request_decision_result(
    notes: str,
    existing_titles: list[str],
    follow_ups: list[FollowUp],
) -> DecisionResult:
    payload = _request_json(_system_prompt(), _user_prompt(notes, existing_titles, follow_ups))
    return _to_decision_result(payload)


def mock_decision_result(notes: str, follow_ups: list[FollowUp]) -> DecisionResult:
    first_line = next((line.strip() for line in notes.splitlines() if line.strip()), "New decision")
    candidate = shorten(first_line.replace("`", ""), width=48, placeholder="")
    title = candidate.rstrip(" .:-") or "New decision"
    normalized = " ".join(notes.split())
    if follow_ups:
        follow_text = " ".join(item.answer for item in follow_ups)
        normalized = f"{normalized} {follow_text}".strip()

    return DecisionDraft(
        title=title[0].upper() + title[1:] if title else "New decision",
        status="adopted",
        decision=(
            "I will consolidate this workflow into the nht tool so it has a single, "
            "easier-to-discover entry point. "
            f"The current notes point to: {shorten(normalized, width=120, placeholder='...')}"
        ),
        context=(
            "The current workflow is spread across small utilities and scripts, "
            "which makes it harder to discover, maintain, and evolve consistently."
        ),
        consequences=(
            "This should reduce duplication and make the tooling easier to grow, "
            "but it also means nht becomes the place I need to keep intentionally organized."
        ),
    )
