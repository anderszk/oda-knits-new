from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    message: str = Field(min_length=10, max_length=3000)
    website: str = Field(default="", max_length=200)

    @field_validator("message", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("name", mode="before")
    @classmethod
    def strip_single_line(cls, value):
        if not isinstance(value, str):
            return value
        return value.strip().replace("\r", " ").replace("\n", " ")

    @model_validator(mode="after")
    def reject_spam(self):
        if self.website:
            raise ValueError("Invalid contact submission")
        return self
