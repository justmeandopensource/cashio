from pydantic import BaseModel, ConfigDict


class TagCreate(BaseModel):
    name: str


class Tag(TagCreate):
    tag_id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
