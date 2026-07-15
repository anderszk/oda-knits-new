from pydantic import BaseModel, Field, field_validator


class StrippedModel(BaseModel):
    """Base for payloads whose string (and string-list) fields get trimmed before validation."""

    @field_validator("*", mode="before")
    @classmethod
    def _strip_whitespace(cls, value):
        if isinstance(value, str):
            return value.strip()
        if isinstance(value, list):
            return [item.strip() if isinstance(item, str) else item for item in value]
        return value


class ProjectColor(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    hex: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
