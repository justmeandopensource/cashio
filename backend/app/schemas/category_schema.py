from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict


class CategoryBase(BaseModel, str_strip_whitespace=True):
    category_id: int
    name: str


class CategoryCreate(BaseModel, str_strip_whitespace=True):
    name: str
    type: Literal["income", "expense"]
    is_group: bool
    parent_category_id: Optional[int] = None


class Category(CategoryCreate):
    category_id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
