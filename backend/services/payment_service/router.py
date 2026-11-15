import logging
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from shared.security.jwt import extract_user_from_token
from shared.config.settings import get_settings
from . import service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["payments"])


def _auth(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing or invalid bearer token")
    return extract_user_from_token(authorization.removeprefix("Bearer ").strip())


class CreateOrderRequest(BaseModel):
    plan_id: str = Field(default="pro_monthly", description="Plan ID to purchase, e.g. pro_monthly")
    gateway: Optional[str] = Field(default=None, description="Payment gateway: 'phonepe' (default) or 'razorpay'")
    redirect_url: Optional[str] = Field(default=None, description="Custom return URL after payment")


class VerifyPaymentRequest(BaseModel):
    # For PhonePe
    merchant_transaction_id: Optional[str] = Field(default=None, description="PhonePe merchant transaction id")
    simulated_success: Optional[bool] = Field(default=False, description="Whether to simulate sandbox success")
    gateway: Optional[str] = Field(default=None, description="Payment gateway used")
    
    # For Razorpay
    razorpay_order_id: Optional[str] = Field(default=None, description="Razorpay order id")
    razorpay_payment_id: Optional[str] = Field(default=None, description="Razorpay payment id")
    razorpay_signature: Optional[str] = Field(default=None, description="Razorpay HMAC signature")


class PhonePeCreateRequest(BaseModel):
    plan_id: str = Field(default="pro_monthly", description="Plan ID to purchase")
    redirect_url: Optional[str] = Field(default=None, description="Redirect URL after PhonePe payment")


class PhonePeVerifyRequest(BaseModel):
    merchant_transaction_id: str = Field(..., description="PhonePe merchant transaction ID")
    simulated_success: Optional[bool] = Field(default=False, description="Accept sandbox simulation")


@router.get("/plans")
async def get_plans():
    """Retrieve all available subscription plans (Basic Free & Pro ₹199)."""
    return {
        "success": True,
        "plans": service.get_available_plans()
    }


@router.get("/subscription")
async def get_user_subscription(authorization: Optional[str] = Header(None)):
    """Fetch active subscription status, default gateway, and quota for current user."""
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
    """
    Unified checkout order creator:
    Supports PhonePe (default with dynamic UPI QR & Pay Page) and Razorpay.
    """
    user_id = _auth(authorization)
    settings = get_settings()
    gateway = (req.gateway or getattr(settings, "DEFAULT_PAYMENT_GATEWAY", "phonepe")).lower()

    try:
        if gateway == "razorpay":
            order = await service.create_razorpay_order(user_id, req.plan_id)
        else:
            order = await service.create_phonepe_order(user_id, req.plan_id, req.redirect_url)
            
        return {
            "success": True,
            "gateway": gateway,
            "order": order
        }
    except ValueError as ve:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(ve))
    except Exception as e:
        logger.error(f"Error creating {gateway} order: {e}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Failed to create payment order: {str(e)}")


@router.post("/verify")
async def verify_payment(
    req: VerifyPaymentRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Unified payment verifier:
    Verifies PhonePe or Razorpay transaction and activates 30-day Pro subscription.
    """
    user_id = _auth(authorization)
    try:
        # 1. PhonePe verification
        if req.merchant_transaction_id or req.gateway == "phonepe":
            txn_id = req.merchant_transaction_id
            if not txn_id and req.razorpay_order_id:
                txn_id = req.razorpay_order_id
            if not txn_id:
                raise ValueError("merchant_transaction_id is required for PhonePe verification")
            return await service.verify_phonepe_payment(
                user_id=user_id,
                merchant_transaction_id=txn_id,
                simulated_success=bool(req.simulated_success)
            )

        # 2. Razorpay verification
        if req.razorpay_order_id and req.razorpay_payment_id:
            return await service.verify_razorpay_payment(
                user_id=user_id,
                order_id=req.razorpay_order_id,
                payment_id=req.razorpay_payment_id,
                signature=req.razorpay_signature or ""
            )

        raise ValueError("Missing required payment verification details.")
    except ValueError as ve:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(ve))
    except Exception as e:
        logger.error(f"Payment verification failed: {e}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Verification failed: {str(e)}")


# ── Dedicated PhonePe Endpoints ────────────────────────────────────────────────

@router.post("/phonepe/create-order")
async def phonepe_create_order(
    req: PhonePeCreateRequest,
    authorization: Optional[str] = Header(None)
):
    """Explicitly create a PhonePe order with UPI QR and Pay Page redirect."""
    user_id = _auth(authorization)
    try:
        order = await service.create_phonepe_order(user_id, req.plan_id, req.redirect_url)
        return {
            "success": True,
            "order": order
        }
    except ValueError as ve:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(ve))
    except Exception as e:
        logger.error(f"PhonePe order creation error: {e}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e))


@router.post("/phonepe/verify")
async def phonepe_verify(
    req: PhonePeVerifyRequest,
    authorization: Optional[str] = Header(None)
):
    """Verify PhonePe transaction and activate Pro subscription."""
    user_id = _auth(authorization)
    try:
        return await service.verify_phonepe_payment(
            user_id=user_id,
            merchant_transaction_id=req.merchant_transaction_id,
            simulated_success=bool(req.simulated_success)
        )
    except ValueError as ve:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(ve))
    except Exception as e:
        logger.error(f"PhonePe verification error: {e}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e))


@router.get("/upi-qr")
async def get_upi_qr(
    plan_id: str = "pro_monthly",
    authorization: Optional[str] = Header(None)
):
    """Generate dynamic UPI QR code data and payment URI for direct scanning."""
    user_id = _auth(authorization)
    try:
        return await service.generate_upi_qr(user_id, plan_id)
    except Exception as e:
        logger.error(f"UPI QR generation error: {e}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(e))


@router.post("/phonepe/webhook")
async def phonepe_webhook(request: Request):
    """Handle server-to-server callback notifications from PhonePe."""
    try:
        body = await request.json()
        logger.info(f"PhonePe Webhook received: {body}")
        return {"status": "SUCCESS", "message": "Webhook acknowledged"}
    except Exception as e:
        logger.warning(f"PhonePe Webhook parsing failed: {e}")
        return {"status": "SUCCESS"}


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
