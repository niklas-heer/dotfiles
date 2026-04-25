from __future__ import annotations

from dataclasses import dataclass
from typing import ClassVar

from pydantic_settings import BaseSettings, PydanticBaseSettingsSource, SettingsConfigDict

from .source_1password import (
    OnePasswordCliClient,
    OnePasswordClientProtocol,
    OnePasswordSettingsSource,
)


@dataclass(frozen=True, slots=True)
class OnePasswordSourceConfig:
    enabled: bool = True
    cli_path: str = "op"
    timeout_seconds: float = 15.0


class SharedSettingsBase(BaseSettings):
    """Base settings model with centralized 1Password field resolution."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
    )

    onepassword_config: ClassVar[OnePasswordSourceConfig] = OnePasswordSourceConfig()
    onepassword_client: ClassVar[OnePasswordClientProtocol | None] = None

    @classmethod
    def build_onepassword_client(cls) -> OnePasswordClientProtocol:
        if cls.onepassword_client is not None:
            return cls.onepassword_client

        config = cls.onepassword_config
        return OnePasswordCliClient(
            cli_path=config.cli_path,
            timeout_seconds=config.timeout_seconds,
        )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        sources: list[PydanticBaseSettingsSource] = [
            init_settings,
            env_settings,
            dotenv_settings,
        ]

        if cls.onepassword_config.enabled:
            sources.append(
                OnePasswordSettingsSource(
                    settings_cls,
                    client=cls.build_onepassword_client(),
                )
            )

        sources.append(file_secret_settings)
        return tuple(sources)
