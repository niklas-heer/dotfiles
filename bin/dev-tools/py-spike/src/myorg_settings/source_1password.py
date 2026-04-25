from __future__ import annotations

import subprocess
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Protocol

from pydantic.fields import FieldInfo
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource
from pydantic_settings.exceptions import SettingsError

from .fields import OnePasswordSecret, get_onepassword_secret


class OnePasswordLookupError(RuntimeError):
    """Raised when a configured 1Password secret cannot be resolved."""


class OnePasswordClientProtocol(Protocol):
    def read(self, secret: OnePasswordSecret) -> str:
        """Resolve a single secret from 1Password."""


@dataclass(frozen=True, slots=True)
class OnePasswordCliClient:
    """Load secret values via `op read`, authenticated by the user's environment."""

    cli_path: str = "op"
    timeout_seconds: float = 15.0

    def read(self, secret: OnePasswordSecret) -> str:
        command = [self.cli_path, "read", secret.secret_reference()]
        try:
            result = subprocess.run(
                command,
                check=True,
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds,
            )
        except FileNotFoundError as error:
            raise OnePasswordLookupError(
                f"Could not execute 1Password CLI at {self.cli_path!r}."
            ) from error
        except subprocess.TimeoutExpired as error:
            raise OnePasswordLookupError(
                f"Timed out reading 1Password secret {secret.field_id!r}."
            ) from error
        except subprocess.CalledProcessError as error:
            stderr = error.stderr.strip() or error.stdout.strip()
            raise OnePasswordLookupError(
                "1Password CLI failed while reading "
                f"{secret.secret_reference()!r}: {stderr or error!s}"
            ) from error

        value = result.stdout.strip()
        if not value:
            raise OnePasswordLookupError(
                f"1Password returned an empty value for {secret.secret_reference()!r}."
            )
        return value


@dataclass(frozen=True, slots=True)
class StaticOnePasswordClient:
    """Small in-memory backend for tests and examples."""

    values_by_reference: Mapping[str, str]

    def read(self, secret: OnePasswordSecret) -> str:
        reference = secret.secret_reference()
        try:
            return self.values_by_reference[reference]
        except KeyError as error:
            raise OnePasswordLookupError(
                f"No static value was configured for {reference!r}."
            ) from error


class OnePasswordSettingsSource(PydanticBaseSettingsSource):
    """Custom Pydantic settings source backed by field metadata + 1Password."""

    def __init__(
        self,
        settings_cls: type[BaseSettings],
        *,
        client: OnePasswordClientProtocol,
    ) -> None:
        super().__init__(settings_cls)
        self._client = client

    def get_field_value(self, field: FieldInfo, field_name: str) -> tuple[object | None, str, bool]:
        secret = get_onepassword_secret(field)
        if secret is None:
            return None, field_name, False

        if field_name in self.current_state:
            return None, field_name, False

        value = self._client.read(secret)
        return value, field_name, False

    def __call__(self) -> dict[str, object]:
        data: dict[str, object] = {}

        for field_name, field in self.settings_cls.model_fields.items():
            secret = get_onepassword_secret(field)
            if secret is None or field_name in self.current_state:
                continue

            try:
                value, key, value_is_complex = self.get_field_value(field, field_name)
                if value is None:
                    continue
                prepared = self.prepare_field_value(field_name, field, value, value_is_complex)
            except OnePasswordLookupError as error:
                description = secret.description or field_name
                raise SettingsError(
                    "Failed to load 1Password-backed setting "
                    f"{field_name!r} ({description}): {error}"
                ) from error

            data[key] = prepared

        return data
