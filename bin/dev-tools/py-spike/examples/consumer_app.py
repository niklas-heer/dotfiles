from __future__ import annotations

from typing import Annotated

from pydantic import SecretStr
from pydantic_settings import SettingsConfigDict

from myorg_settings import OnePasswordSecret, OnePasswordSourceConfig, SharedSettingsBase


class Settings(SharedSettingsBase):
    model_config = SettingsConfigDict(
        env_prefix="DEMO_",
        env_file=None,
        extra="ignore",
    )

    onepassword_config = OnePasswordSourceConfig(
        enabled=True,
        cli_path="op",
        timeout_seconds=10.0,
    )

    openrouter_api_key: Annotated[
        SecretStr,
        OnePasswordSecret(
            vault_id="vault-uuid",
            item_id="item-uuid",
            field_id="field-uuid",
            description="OpenRouter API key",
            docs="https://openrouter.ai/docs/api-keys",
            sensitive=True,
        ),
    ]

    timeout_seconds: int = 30
    base_url: str = "https://openrouter.ai/api/v1"


def main() -> None:
    # Runtime values are injected by the custom 1Password-backed settings source.
    settings = Settings()  # ty: ignore[missing-argument]
    print(
        {
            "base_url": settings.base_url,
            "timeout_seconds": settings.timeout_seconds,
            "openrouter_api_key_loaded": bool(
                settings.openrouter_api_key.get_secret_value()
            ),
        }
    )


if __name__ == "__main__":
    main()
