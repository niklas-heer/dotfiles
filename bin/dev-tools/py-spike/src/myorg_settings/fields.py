from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from pydantic.fields import FieldInfo

type OnePasswordAttribute = Literal["value", "password", "username", "otp", "notesPlain"]


@dataclass(frozen=True, slots=True)
class OnePasswordSecret:
    """Stable metadata describing where a secret lives in 1Password."""

    vault_id: str
    item_id: str
    field_id: str
    section_id: str | None = None
    attribute: OnePasswordAttribute = "value"
    description: str | None = None
    docs: str | None = None
    sensitive: bool = True

    def secret_reference(self) -> str:
        parts = [self.vault_id, self.item_id]
        if self.section_id:
            parts.append(self.section_id)
        parts.append(self.field_id)
        reference = f"op://{'/'.join(parts)}"
        if self.attribute != "value":
            return f"{reference}?attribute={self.attribute}"
        return reference


def get_onepassword_secret(field: FieldInfo) -> OnePasswordSecret | None:
    for metadata in field.metadata:
        if isinstance(metadata, OnePasswordSecret):
            return metadata
    return None
