from pydantic import Field, model_validator

from backend.models.common import ProjectColor, StrippedModel


class ProductPayload(StrippedModel):
    id: str = ""
    title: str = Field(min_length=2, max_length=100)
    category: str = Field(min_length=2, max_length=100)
    price: int = Field(ge=0, le=100000)
    description: str = Field(min_length=10, max_length=1200)
    colors: list[ProjectColor] = Field(min_length=1)
    sizes: list[str] = Field(min_length=1)
    badge: str = Field(default="", max_length=40)
    image: str = Field(default="", max_length=300)
    images: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def normalize_product_images(self):
        self.images = [image for image in self.images if image]
        if self.image and self.image not in self.images:
            self.images.insert(0, self.image)
        self.image = self.image or (self.images[0] if self.images else "")
        return self
