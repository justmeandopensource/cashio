from typing import List, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies import get_validated_ledger
from app.models.model import Category, Ledger, Tag
from app.repositories.insights import (
    category_trend_crud,
    current_month_overview_crud,
    income_expense_trend_crud,
    tag_trend_crud,
)
from app.repositories.insights.store_location_crud import (
    get_category_breakdown_by_location,
    get_category_breakdown_by_store,
    get_expense_by_location,
    get_expense_by_store,
)
from app.repositories.insights.expense_calendar_crud import get_expense_calendar
from app.schemas import insights_schema, user_schema
from app.schemas.insights import category_trend_schema, tag_trend_schema
from app.schemas.insights.store_location_schema import (
    ExpenseByLocationResponse,
    ExpenseByStoreResponse,
    LocationCategoryBreakdownResponse,
    StoreCategoryBreakdownResponse,
)
from app.schemas.insights.expense_calendar_schema import ExpenseCalendarResponse
from app.security.user_security import get_current_user

insights_router = APIRouter(prefix="/ledger/{ledger_id}/insights", tags=["insights"])


@insights_router.get(
    "/income-expense-trend",
    response_model=insights_schema.IncomeExpenseTrendResponse,
)
def get_income_expense_trend(
    ledger_id: int,
    period_type: Literal[
        "last_12_months", "monthly_since_beginning", "yearly_since_beginning"
    ] = Query(
        default="last_12_months",
        description="Type of period to analyze: last_12_months, monthly_since_beginning, or yearly_since_beginning",
    ),
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    try:
        return income_expense_trend_crud.get_income_expense_trend(
            db=db, ledger_id=ledger_id, period_type=period_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating insights: {str(e)}",
        )


@insights_router.get(
    "/current-month-overview",
    response_model=insights_schema.MonthOverviewResponse,
)
def get_current_month_overview(
    ledger_id: int,
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    try:
        return current_month_overview_crud.get_current_month_overview(
            db=db, ledger_id=ledger_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating overview: {str(e)}",
        )


@insights_router.get(
    "/category-trend",
    response_model=category_trend_schema.CategoryTrendResponse,
)
def get_category_trend(
    ledger_id: int,
    category_id: int,
    period_type: Literal[
        "last_12_months", "monthly_since_beginning", "yearly_since_beginning"
    ] = Query(
        default="last_12_months",
        description="Type of period to analyze: last_12_months, monthly_since_beginning, or yearly_since_beginning",
    ),
    ledger: Ledger = Depends(get_validated_ledger),
    user: user_schema.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check if category exists and belongs to the user
    category = db.query(Category).filter(Category.category_id == category_id).first()
    if category is None or category.user_id != user.user_id:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )

    try:
        return category_trend_crud.get_category_trend(
            db=db, ledger_id=ledger_id, category_id=category_id, period_type=period_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating category trend: {str(e)}",
        )


@insights_router.get(
    "/tag-trend",
    response_model=tag_trend_schema.TagTrendResponse,
)
def get_tag_trend(
    ledger_id: int,
    tag_names: List[str] = Query(..., description="Names of tags to analyze"),
    ledger: Ledger = Depends(get_validated_ledger),
    user: user_schema.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify that all tags belong to the user and collect their IDs
    tag_ids = []
    for tag_name in tag_names:
        tag = (
            db.query(Tag)
            .filter(Tag.name == tag_name, Tag.user_id == user.user_id)
            .first()
        )
        if tag is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tag with name '{tag_name}' not found or does not belong to user",
            )
        tag_ids.append(tag.tag_id)

    try:
        return tag_trend_crud.get_tag_trend(db=db, ledger_id=ledger_id, tag_ids=tag_ids)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating tag trend: {str(e)}",
        )


@insights_router.get(
    "/expense-by-store",
    response_model=ExpenseByStoreResponse,
)
def get_expense_by_store_route(
    ledger_id: int,
    period_type: Literal[
        "all_time", "last_12_months", "this_month"
    ] = Query(
        default="all_time",
        description="Type of period to analyze: all_time, last_12_months, or this_month",
    ),
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    try:
        return get_expense_by_store(
            db=db, ledger_id=ledger_id, period_type=period_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating expense by store insights: {str(e)}",
        )


@insights_router.get(
    "/expense-by-location",
    response_model=ExpenseByLocationResponse,
)
def get_expense_by_location_route(
    ledger_id: int,
    period_type: Literal[
        "all_time", "last_12_months", "this_month"
    ] = Query(
        default="all_time",
        description="Type of period to analyze: all_time, last_12_months, or this_month",
    ),
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    try:
        return get_expense_by_location(
            db=db, ledger_id=ledger_id, period_type=period_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating expense by location insights: {str(e)}",
        )


@insights_router.get(
    "/expense-by-store/categories",
    response_model=StoreCategoryBreakdownResponse,
)
def get_store_category_breakdown_route(
    ledger_id: int,
    store_name: str = Query(..., description="Store name to get category breakdown for"),
    period_type: Literal[
        "all_time", "last_12_months", "this_month"
    ] = Query(
        default="all_time",
        description="Type of period to analyze: all_time, last_12_months, or this_month",
    ),
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    try:
        return get_category_breakdown_by_store(
            db=db, ledger_id=ledger_id, store_name=store_name, period_type=period_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating store category breakdown: {str(e)}",
        )


@insights_router.get(
    "/expense-by-location/categories",
    response_model=LocationCategoryBreakdownResponse,
)
def get_location_category_breakdown_route(
    ledger_id: int,
    location_name: str = Query(..., description="Location name to get category breakdown for"),
    period_type: Literal[
        "all_time", "last_12_months", "this_month"
    ] = Query(
        default="all_time",
        description="Type of period to analyze: all_time, last_12_months, or this_month",
    ),
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    try:
        return get_category_breakdown_by_location(
            db=db, ledger_id=ledger_id, location_name=location_name, period_type=period_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating location category breakdown: {str(e)}",
        )


@insights_router.get(
    "/expense-calendar",
    response_model=ExpenseCalendarResponse,
)
def get_expense_calendar_route(
    ledger_id: int,
    year: int = Query(..., description="Year to analyze", ge=2000, le=2100),
    ledger: Ledger = Depends(get_validated_ledger),
    db: Session = Depends(get_db),
):
    try:
        return get_expense_calendar(
            db=db, ledger_id=ledger_id, year=year
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating expense calendar insights: {str(e)}",
        )
