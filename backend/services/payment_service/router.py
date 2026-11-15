import logging
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field
from shared.security.jwt import extract_user_from_token
from . import service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["payments"])


def _auth(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing or invalid bearer token")
    return extract_user_from_token(authorization.removeprefix("Bearer ").strip())


class CreateOrderRequest(BaseModel):
    plan_id: str = Field(default="pro_monthly", description="Plan ID to purchase, e.g. pro_monthly")


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str = Field(..., description="Razorpay order id")
    razorpay_payment_id: str = Field(..., description="Razorpay payment id")
    razorpay_signature: str = Field(..., description="Razorpay HMAC signature")


@router.get("/plans")
async def get_plans():
    """Retrieve all available subscription plans (Basic Free & Pro ₹199)."""
    return {
        "success": True,
        "plans": service.get_available_plans()
    }


@router.get("/subscription")
async def get_user_subscription(authorization: Optional[str] = Header(None)):
    """Fetch active subscription status and quota for current user."""
    user_id = _auth(authorization)
    try:
        data = await service.get_user_subscription_status(user_id)
        return {
            "success": True,
            **data
        }
    except Exception as e:
        logger.error(f"Error fetching subscription: {e}")
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.post("/create-order")
async def create_order(
    req: CreateOrderRequest,
    authorization: Optional[str] = Header(None)
):
    """Create a new Razorpay checkout order for plan subscription."""
    user_id = _auth(authorization)
    try:
        order = await service.create_razorpay_order(user_id, req.plan_id)
        return {
            "success": True,
            "order": order
        }
    except ValueError as ve:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(ve))
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to create payment order")


@router.post("/verify")
async def verify_payment(
    req: VerifyPaymentRequest,
    authorization: Optional[str] = Header(None)
):
    """Verify Razorpay payment signature and activate Pro subscription for 30 days."""
    user_id = _auth(authorization)
    try:
        res = await service.verify_razorpay_payment(
            user_id=user_id,
            order_id=req.razorpay_order_id,
            payment_id=req.razorpay_payment_id,
            signature=req.razorpay_signature
        )
        return res
    except ValueError as ve:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(ve))
    except Exception as e:
        logger.error(f"Payment verification failed: {e}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Verification failed: {str(e)}")


@router.get("/history")
async def get_payment_history(authorization: Optional[str] = Header(None)):
    """Retrieve billing and payment transaction history for current user."""
    user_id = _auth(authorization)
    try:
        history = await service.get_user_payment_history(user_id)
        return {
            "success": True,
            "history": history
        }
    except Exception as e:
        logger.error(f"Error fetching payment history: {e}")
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

