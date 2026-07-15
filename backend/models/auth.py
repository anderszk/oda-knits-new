from pydantic import BaseModel, ConfigDict


class LoginPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    password: str
