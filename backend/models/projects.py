from pydantic import Field, model_validator

from backend.models.common import ProjectColor, StrippedModel


class ProjectPayload(StrippedModel):
    id: str = ""
    title: str = Field(min_length=2, max_length=100)
    category: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=10, max_length=1200)
    image: str = ""
    images: list[str] = Field(default_factory=list, min_length=1)
    yarn: str = Field(min_length=1, max_length=160)
    fiber: str = Field(min_length=1, max_length=160)
    technique: str = Field(min_length=1, max_length=160)
    needles: str = Field(min_length=1, max_length=80)
    size: str = Field(min_length=1, max_length=80)
    time: str = Field(min_length=1, max_length=80)
    year: str = Field(min_length=1, max_length=20)
    colors: list[ProjectColor] = Field(min_length=1)

    @model_validator(mode="after")
    def require_project_details(self):
        self.images = [image for image in self.images if image]
        if self.image and self.image not in self.images:
            self.images.insert(0, self.image)
        if not self.images:
            raise ValueError("At least one project image is required")
        self.image = self.image or self.images[0]
        if self.year.lower() == "wip":
            self.year = "WIP"
        return self
