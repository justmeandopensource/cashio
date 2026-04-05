from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.repositories.insights.fund_flow_crud import get_fund_flow
from app.schemas.insights.fund_flow_schema import FundFlowResponse
from app.schemas import user_schema
from app.security.user_security import get_current_user

fund_flow_router = APIRouter(prefix="/insights", tags=["insights"])


@fund_flow_router.get(
    "/fund-flow",
    response_model=FundFlowResponse,
)
def get_fund_flow_endpoint(
    period_type: Literal["last_12_months", "last_month", "current_month"] = Query(
        default="current_month",
        description="Period to analyze: current_month, last_month, or last_12_months",
    ),
    user: user_schema.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return get_fund_flow(
            db=db,
            user_id=user.user_id,
            period_type=period_type,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating fund flow: {str(e)}",
        )
