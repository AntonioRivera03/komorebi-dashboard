from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="KOMOREBI_", env_file=".env", extra="ignore")
    database_url: SecretStr = SecretStr(
        "postgresql+psycopg://komorebi:komorebi@127.0.0.1:5432/komorebi"
    )
    environment: Literal["development", "test", "production"] = "development"
    session_secret: SecretStr = SecretStr("")
    secure_cookies: bool = True
    session_hours: int = Field(default=168, ge=1, le=720)
    allowed_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    allowed_hosts: list[str] = ["localhost", "127.0.0.1", "testserver"]
    file_root: Path = Path(".data/files")
    encryption_key: SecretStr | None = None
    max_upload_bytes: int = Field(default=10 * 1024 * 1024, ge=1, le=100 * 1024 * 1024)
    max_body_bytes: int = Field(default=1024 * 1024, ge=1024)
    enabled_modules: list[str] = ["tasks", "usage", "conversations", "learn"]
    worker_poll_seconds: float = Field(default=1, gt=0, le=60)
    lease_seconds: int = Field(default=120, ge=10)
    external_jobs_enabled: bool = False
    ai_disclosure_allowed: bool = False
    ai_monthly_budget_units: int = Field(default=100000, ge=0)

    @model_validator(mode="after")
    def validate_security(self):
        if self.environment != "test" and not self.database_url.get_secret_value().startswith(
            "postgresql+psycopg://"
        ):
            raise ValueError("Runtime persistence requires PostgreSQL with the psycopg driver")
        if len(self.session_secret.get_secret_value()) < 32:
            raise ValueError("KOMOREBI_SESSION_SECRET must contain at least 32 random characters")
        if self.environment == "production" and not self.secure_cookies:
            raise ValueError("Production sessions require secure cookies and TLS")
        if "*" in self.allowed_origins:
            raise ValueError("Credentialed CORS requires explicit origins")
        return self
