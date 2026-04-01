from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.repositories import search_crud
from app.schemas import user_schema
from app.schemas.search_schema import SearchResponse
from app.security.user_security import get_current_user

search_router = APIRouter(prefix="/search", tags=["search"])


@search_router.get("", response_model=SearchResponse)
def global_search(
    q: str = Query(min_length=1, description="Search query"),
    limit_per_type: int = Query(default=5, ge=1, le=10, description="Max results per entity type"),
    user: user_schema.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = search_crud.search(
        db=db,
        user_id=user.user_id,  # type: ignore
        query=q,
        limit_per_type=limit_per_type,
    )

    return SearchResponse(
        results=results,
        total_count=len(results),
        query=q,
    )
