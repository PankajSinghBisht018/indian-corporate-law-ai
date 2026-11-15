import os
import hmac
import hashlib
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
import httpx
from shared.config.settings import get_settings
from shared.database.user_repo import UserRepository

logger = logging.getLogger(__name__)

# ── Available Plans ────────────────────────────────────────────────────────────
AVAILABLE_PLANS = {
    "basic_free": {
        "id": "basic_free",
        "name": "Basic (Free)",
        "badge": "Current Plan",
        "price": 0,
        "currency": "INR",
        "billing_cycle": "Forever Free",
        "description": "Essential IT corporate legal clause extraction for individuals & interns.",
        "quota": 5,
        "quota_label": "5 documents / day",
        "is_unlimited": False,
        "features": [
            "5 Document analyses per day",
            "IT Employment Offer Letter & Bond review",
            "Core Legal Risk Scoring & Clause highlights",
            "Standard Cloud LLM analysis",
            "Community Support"
        ],
        "is_popular": False
    },
    "pro_monthly": {
        "id": "pro_monthly",
        "name": "Pro Subscription",
        "badge": "MOST POPULAR",
        "price": 199,
        "currency": "INR",
        "amount_paise": 19900,
        "billing_cycle": "Monthly (₹199 / month)",
        "description": "Full-spectrum IT legal governance, unlimited analyses & statutory compliance.",
        "quota": None,
        "quota_label": "Unlimited documents",
        "is_unlimited": True,
        "features": [
            "Unlimited Document Uploads & Analyses (No daily caps)",
            "Deep IT Corporate Law Risk Assessment (ICA Sec 27 & IT Act 2000)",
            "Non-Compete & Employment Bond Enforceability Checker",
            "Priority AI Queue (Fastest processing speeds)",
            "Executive Summaries & PDF/DOCX Clause Reports",
            "Full Audit Trail & Invoice Receipts",
            "Priority Support from Legal & Tech Specialists"
        ],
        "is_popular": True
    }
}


def get_available_plans() -> List[Dict[str, Any]]:
    return list(AVAILABLE_PLANS.values())


def is_placeholder_key(key: str) -> bool:
    if not key:
        return True
    key = key.strip().lower()
    return "yourtestkey" in key or "placeholder" in key or "change-me" in key or key == "rzp_test_yourtestkeyidhere"


async def create_razorpay_order(user_id: str, plan_id: str = "pro_monthly") -> Dict[str, Any]:
    """Create a Razorpay order for the selected subscription plan."""
    if plan_id not in AVAILABLE_PLANS:
        raise ValueError(f"Invalid plan ID: {plan_id}")

    plan = AVAILABLE_PLANS[plan_id]
    if plan["price"] == 0:
        raise ValueError("Basic plan is free; no payment order required.")

    user = await UserRepository.find_user_by_id(user_id)
    if not user:
        raise ValueError("User not found.")

    settings = get_settings()
    key_id = settings.RAZORPAY_KEY_ID
    key_secret = settings.RAZORPAY_KEY_SECRET

    amount_paise = plan["amount_paise"]
    receipt = f"rcpt_{uuid.uuid4().hex[:12]}"
    user_email = user.get("email", "")
    user_name = user.get("name") or user_email.split("@")[0]

    order_id = None
    is_mock = is_placeholder_key(key_id) or is_placeholder_key(key_secret)

    if not is_mock:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    "https://api.razorpay.com/v1/orders",
                    auth=(key_id, key_secret),
                    json={
                        "amount": amount_paise,
                        "currency": "INR",
                        "receipt": receipt,
                        "notes": {
                            "user_id": str(user["_id"]),
                            "user_email": user_email,
                            "plan_id": plan_id
                        }
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    order_id = data.get("id")
                    logger.info(f"✅ Real Razorpay Order created: {order_id} for user {user_email}")
                else:
                    logger.warning(f"Razorpay API responded with {res.status_code}: {res.text}. Falling back to sandbox simulation.")
                    is_mock = True
        except Exception as e:
            logger.warning(f"Razorpay connection failed: {e}. Falling back to sandbox simulation mode.")
            is_mock = True

    if is_mock or not order_id:
        order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
        logger.info(f"🧪 Created Mock / Test Razorpay Order: {order_id} for user {user_email}")

    order_doc = {
        "order_id": order_id,
        "user_id": str(user["_id"]),
        "user_email": user_email,
        "plan_id": plan_id,
        "plan_name": plan["name"],
        "amount": plan["price"],
        "amount_paise": amount_paise,
        "currency": "INR",
        "receipt": receipt,
        "status": "created",
        "is_mock": is_mock
    }
    await UserRepository.save_payment_order(order_doc)

    return {
        "order_id": order_id,
        "amount": amount_paise,
        "currency": "INR",
        "key_id": key_id if not is_placeholder_key(key_id) else "rzp_test_DEMO_KEY",
        "plan_id": plan_id,
        "plan_name": plan["name"],
        "price_inr": plan["price"],
        "is_mock": is_mock,
        "prefill": {
            "name": user_name,
            "email": user_email
        }
    }


async def verify_razorpay_payment(
    user_id: str, 
    order_id: str, 
    payment_id: str, 
    signature: str
) -> Dict[str, Any]:
    """Verify payment signature and activate Pro subscription for 30 days."""
    user = await UserRepository.find_user_by_id(user_id)
    if not user:
        raise ValueError("User not found.")

    order = await UserRepository.get_payment_order(order_id)
    if not order:
        raise ValueError("Payment order not found.")

    settings = get_settings()
    key_secret = settings.RAZORPAY_KEY_SECRET

    is_mock = order.get("is_mock", False) or is_placeholder_key(key_secret)

    # Signature verification
    if not is_mock:
        payload = f"{order_id}|{payment_id}".encode("utf-8")
        expected_sig = hmac.new(key_secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_sig, signature):
            logger.error(f"❌ Signature mismatch for order {order_id}. Provided: {signature}, Expected: {expected_sig}")
            raise ValueError("Payment verification failed: Invalid Razorpay signature.")
    else:
        logger.info(f"🧪 Mock verification accepted for order {order_id}")

    # Update order status to paid
    await UserRepository.update_payment_order(order_id, {
        "status": "paid",
        "payment_id": payment_id,
        "signature": signature
    })

    # Activate 30-day Pro subscription
    updated_user = await UserRepository.activate_subscription(
        user_id=user_id,
        plan_id=order.get("plan_id", "pro_monthly"),
        duration_days=30,
        order_id=order_id,
        payment_id=payment_id
    )

    # Save transaction in payment audit history
    payment_record = {
        "user_id": str(user["_id"]),
        "user_email": user.get("email"),
        "user_name": user.get("name") or user.get("email", "").split("@")[0],
        "order_id": order_id,
        "payment_id": payment_id,
        "plan_id": order.get("plan_id", "pro_monthly"),
        "plan_name": order.get("plan_name", "Pro Subscription"),
        "amount": order.get("amount", 199),
        "amount_paise": order.get("amount_paise", 19900),
        "currency": "INR",
        "status": "success",
        "is_mock": is_mock,
        "payment_method": "Razorpay"
    }
    await UserRepository.record_payment(payment_record)

    logger.info(f"🎉 Subscription PRO activated for user {user.get('email')} until {updated_user.get('subscription_expiry')}")

    return {
        "success": True,
        "message": "Payment verified successfully. Pro subscription activated!",
        "plan": "pro",
        "plan_id": order.get("plan_id", "pro_monthly"),
        "subscription_status": "active",
        "subscription_expiry": updated_user.get("subscription_expiry"),
        "is_unlimited": True,
        "order_id": order_id,
        "payment_id": payment_id
    }


async def get_user_subscription_status(user_id: str) -> Dict[str, Any]:
    """Calculate and return user's active subscription status."""
    user = await UserRepository.find_user_by_id(user_id)
    if not user:
        raise ValueError("User not found")

    settings = get_settings()
    email = user.get("email", "").lower()
    is_admin = (
        user.get("role") == "admin" 
        or email in settings.ADMIN_EMAILS
    )

    tier = user.get("subscription_tier", "free").lower()
    expiry_iso = user.get("subscription_expiry")
    days_left = 0
    is_active_pro = False

    if tier in ["pro", "paid", "premium"] and expiry_iso:
        try:
            clean_iso = expiry_iso.replace("Z", "+00:00")
            exp_dt = datetime.fromisoformat(clean_iso)
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            if exp_dt > now:
                is_active_pro = True
                days_left = max(0, (exp_dt - now).days)
            else:
                # Expired
                tier = "free"
        except Exception:
            is_active_pro = True

    if is_admin:
        tier = "admin"
        plan_name = "Admin Unlimited Plan"
        is_unlimited = True
    elif is_active_pro:
        tier = "pro"
        plan_name = "Pro Subscription"
        is_unlimited = True
    else:
        tier = "free"
        plan_name = "Basic (Free)"
        is_unlimited = False

    return {
        "tier": tier,
        "plan_name": plan_name,
        "is_active": is_admin or is_active_pro or tier == "free",
        "is_pro": is_active_pro,
        "is_admin": is_admin,
        "is_unlimited": is_unlimited,
        "subscription_expiry": expiry_iso if is_active_pro else None,
        "days_left": days_left if is_active_pro else None,
        "daily_doc_count": user.get("daily_doc_count", 0),
        "doc_limit": None if is_unlimited else 5,
        "last_payment_id": user.get("last_payment_id")
    }


async def get_user_payment_history(user_id: str) -> List[Dict[str, Any]]:
    return await UserRepository.get_payment_history(user_id)

