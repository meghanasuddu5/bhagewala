import os
from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )

    PROJECT_NAME: str = "Baghewala Well-to-Surface Digital Twin"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Base directory: resolved relative to this file (backend/app/core/config.py -> backend root is parents[2])
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    # Model paths
    MODEL_PATH: str = Field(default="")
    MANIFEST_PATH: str = Field(default="")
    METRICS_PATH: str = Field(default="")

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    def get_model_path(self) -> Path:
        if self.MODEL_PATH:
            p = Path(self.MODEL_PATH)
            return p if p.is_absolute() else self.BASE_DIR / p
        return self.BASE_DIR / "models" / "production" / "two_stage_oil_model.joblib"

    def get_manifest_path(self) -> Path:
        if self.MANIFEST_PATH:
            p = Path(self.MANIFEST_PATH)
            return p if p.is_absolute() else self.BASE_DIR / p
        return self.BASE_DIR / "models" / "production" / "model_manifest.json"

    def get_metrics_path(self) -> Path:
        if self.METRICS_PATH:
            p = Path(self.METRICS_PATH)
            return p if p.is_absolute() else self.BASE_DIR / p
        return self.BASE_DIR / "models" / "production" / "v1_3_metrics.csv"


settings = Settings()
