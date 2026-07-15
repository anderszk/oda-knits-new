from pydantic import BaseModel, Field, field_validator

from backend.models.common import StrippedModel


class AboutDetail(StrippedModel):
    label: str = Field(min_length=1, max_length=80)
    value: str = Field(min_length=1, max_length=160)


class AboutPayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    headline: str = Field(min_length=5, max_length=240)
    body: list[str] = Field(min_length=1)
    details: list[AboutDetail] = Field(min_length=1)
    stats: list[AboutDetail] = Field(min_length=1)

    @field_validator("name", "headline", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("body", mode="before")
    @classmethod
    def strip_body(cls, value):
        return [item.strip() for item in value if item.strip()] if isinstance(value, list) else value


class ContactInfoPayload(StrippedModel):
    eyebrow: str = Field(min_length=1, max_length=80)
    heading: str = Field(min_length=5, max_length=180)
    body: str = Field(min_length=5, max_length=500)
    button: str = Field(min_length=1, max_length=40)
    success: str = Field(min_length=5, max_length=160)
