from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class OrderItem(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=100)
    price: int = Field(ge=0, le=100000)
    size: str = Field(min_length=1, max_length=40)
    quantity: int = Field(ge=1, le=20)


class ShippingInfo(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    address: str = Field(min_length=4, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=3, max_length=12)
    phone: str = Field(default="", max_length=30)

    @field_validator("name", "address", "city", "phone", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class OrderPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[OrderItem] = Field(min_length=1, max_length=50)
    shipping: ShippingInfo
    payment_method: str = Field(min_length=2, max_length=40)
    payment_reference: str = Field(min_length=1, max_length=200)
    website: str = Field(default="", max_length=200)

    @model_validator(mode="after")
    def reject_spam(self):
        if self.website:
            raise ValueError("Invalid order submission")
        return self


class PaymentItemsPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[OrderItem] = Field(min_length=1, max_length=50)


class VippsPaymentPayload(PaymentItemsPayload):
    return_url: str = Field(min_length=8, max_length=300)
