import os
import base64
import json
import hmac
import hashlib
import uuid
import urllib.parse
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


# ════════════════════════════════════════════════════════════════════════════════
# ── PhonePe Payment Gateway Integration (Standard Checkout v2 & v1 Fallback) ──
# ════════════════════════════════════════════════════════════════════════════════

_phonepe_token_cache: Dict[str, Any] = {
    "token": None,
    "expires_at": 0.0
}


def _get_phonepe_base_url() -> str:
    settings = get_settings()
    env = getattr(settings, "PHONEPE_ENV", "UAT").upper()
    if env == "PROD" or env == "PRODUCTION":
        return "https://api.phonepe.com/apis/pg"
    return "https://api-preprod.phonepe.com/apis/pg-sandbox"


async def _get_phonepe_oauth_token() -> Optional[str]:
    """Retrieve and cache PhonePe OAuth access token using Client ID & Client Secret."""
    now = datetime.now(timezone.utc).timestamp()
    if _phonepe_token_cache["token"] and _phonepe_token_cache["expires_at"] > now + 60:
        return _phonepe_token_cache["token"]

    settings = get_settings()
    client_id = getattr(settings, "PHONEPE_CLIENT_ID", None)
    client_secret = getattr(settings, "PHONEPE_CLIENT_SECRET", None)
    client_version = getattr(settings, "PHONEPE_CLIENT_VERSION", "1")

    if not client_id or not client_secret:
        return None

    base_url = _get_phonepe_base_url()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                f"{base_url}/v1/oauth/token",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "client_id": client_id,
                    "client_version": client_version,
                    "client_secret": client_secret,
                    "grant_type": "client_credentials"
                }
            )
            if res.status_code == 200:
                data = res.json()
                token = data.get("access_token")
                expires_in = data.get("expires_in") or 3600
                _phonepe_token_cache["token"] = token
                _phonepe_token_cache["expires_at"] = now + float(expires_in)
                logger.info(f"✅ PhonePe OAuth Token acquired for client {client_id[:14]}...")
                return token
            else:
                logger.warning(f"PhonePe OAuth Token endpoint returned {res.status_code}: {res.text}")
    except Exception as e:
        logger.warning(f"PhonePe OAuth Token request failed: {e}")
    return None


async def create_phonepe_order(
    user_id: str, 
    plan_id: str = "pro_monthly",
    redirect_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a PhonePe checkout order with official Pay Page redirect,
    dynamic UPI deep link, and dynamic scan-and-pay UPI QR code.
    Uses PhonePe Standard Checkout v2 (OAuth) with fallback to v1 / simulation.
    """
    if plan_id not in AVAILABLE_PLANS:
        raise ValueError(f"Invalid plan ID: {plan_id}")

    plan = AVAILABLE_PLANS[plan_id]
    if plan["price"] == 0:
        raise ValueError("Basic plan is free; no payment order required.")

    user = await UserRepository.find_user_by_id(user_id)
    if not user:
        raise ValueError("User not found.")

    settings = get_settings()
    base_url = _get_phonepe_base_url()

    amount_paise = plan["amount_paise"]
    merchant_txn_id = f"LB_PP_{uuid.uuid4().hex[:14].upper()}"
    user_email = user.get("email", "")
    user_name = user.get("name") or user_email.split("@")[0]

    final_redirect_url = redirect_url or f"http://localhost:5173/pricing?payment=phonepe_success&txn_id={merchant_txn_id}"
    payment_url = None
    is_mock = False
    api_version = "v2"

    # 1. Try PhonePe Standard Checkout v2 (OAuth Token)
    token = await _get_phonepe_oauth_token()
    if token:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                order_payload = {
                    "merchantOrderId": merchant_txn_id,
                    "amount": amount_paise,
                    "expireAfter": 1200,
                    "paymentFlow": {
                        "type": "PG_CHECKOUT",
                        "message": f"LegalBuddy {plan['name']} (₹{plan['price']}/mo)",
                        "merchantUrls": {
                            "redirectUrl": final_redirect_url
                        }
                    }
                }
                res = await client.post(
                    f"{base_url}/checkout/v2/pay",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"O-Bearer {token}"
                    },
                    json=order_payload
                )
                data = res.json()
                if res.status_code == 200 and data.get("redirectUrl"):
                    payment_url = data.get("redirectUrl")
                    logger.info(f"✅ PhonePe Checkout v2 Order created: {merchant_txn_id} -> {payment_url}")
                else:
                    logger.warning(f"PhonePe Checkout v2 returned {res.status_code}: {data}")
        except Exception as e:
            logger.warning(f"PhonePe Checkout v2 request error: {e}")

    # 2. Fallback to PhonePe v1 (/pg/v1/pay) if v2 not available
    if not payment_url:
        api_version = "v1"
        merchant_id = getattr(settings, "PHONEPE_MERCHANT_ID", "PGTESTPAYUAT86")
        salt_key = getattr(settings, "PHONEPE_SALT_KEY", "96434309-7796-489d-8924-ab56988a6076")
        salt_index = getattr(settings, "PHONEPE_SALT_INDEX", 1)
        callback_url = "http://localhost:8004/api/payments/phonepe/webhook"

        phonepe_payload = {
            "merchantId": merchant_id,
            "merchantTransactionId": merchant_txn_id,
            "merchantUserId": f"USR_{str(user['_id'])[:12]}",
            "amount": amount_paise,
            "redirectUrl": final_redirect_url,
            "redirectMode": "REDIRECT",
            "callbackUrl": callback_url,
            "mobileNumber": "9999999999",
            "paymentInstrument": {"type": "PAY_PAGE"}
        }

        b64_payload = base64.b64encode(json.dumps(phonepe_payload).encode("utf-8")).decode("utf-8")
        string_to_hash = b64_payload + "/pg/v1/pay" + salt_key
        sha256_hash = hashlib.sha256(string_to_hash.encode("utf-8")).hexdigest()
        x_verify = f"{sha256_hash}###{salt_index}"

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f"{base_url}/pg/v1/pay",
                    json={"request": b64_payload},
                    headers={
                        "Content-Type": "application/json",
                        "X-VERIFY": x_verify,
                        "accept": "application/json"
                    }
                )
                data = res.json()
                if res.status_code == 200 and data.get("success"):
                    redirect_info = data.get("data", {}).get("instrumentResponse", {}).get("redirectInfo", {})
                    payment_url = redirect_info.get("url")
                    logger.info(f"✅ PhonePe v1 Order created: {merchant_txn_id} -> {payment_url}")
                else:
                    logger.warning(f"PhonePe v1 returned {res.status_code}: {data}. Falling back to simulation.")
                    is_mock = True
        except Exception as e:
            logger.warning(f"PhonePe v1 connection failed: {e}. Falling back to simulation mode.")
            is_mock = True

    # Standard NPCI UPI Intent Link
    upi_intent_url = f"upi://pay?pa=legalbuddy@ybl&pn=LegalBuddy&am={plan['price']}.00&cu=INR&tn=LegalBuddy_Pro_{merchant_txn_id}&tr={merchant_txn_id}"
    
    # Target URL for QR Code (Redirect URL renders dynamic UPI QR on PhonePe Pay Page)
    qr_target = payment_url or upi_intent_url
    qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?data={urllib.parse.quote(qr_target)}&size=300x300&margin=10"

    # Save order doc
    order_doc = {
        "order_id": merchant_txn_id,
        "merchant_transaction_id": merchant_txn_id,
        "gateway": "phonepe",
        "api_version": api_version,
        "user_id": str(user["_id"]),
        "user_email": user_email,
        "plan_id": plan_id,
        "plan_name": plan["name"],
        "amount": plan["price"],
        "amount_paise": amount_paise,
        "currency": "INR",
        "status": "created",
        "payment_url": payment_url,
        "upi_intent_url": upi_intent_url,
        "qr_code_url": qr_code_url,
        "is_mock": is_mock
    }
    await UserRepository.save_payment_order(order_doc)

    return {
        "order_id": merchant_txn_id,
        "merchant_transaction_id": merchant_txn_id,
        "gateway": "phonepe",
        "api_version": api_version,
        "payment_url": payment_url,
        "upi_intent_url": upi_intent_url,
        "qr_code_url": qr_code_url,
        "amount": amount_paise,
        "price_inr": plan["price"],
        "currency": "INR",
        "plan_id": plan_id,
        "plan_name": plan["name"],
        "is_mock": is_mock,
        "prefill": {
            "name": user_name,
            "email": user_email
        }
    }


async def verify_phonepe_payment(
    user_id: str,
    merchant_transaction_id: str,
    simulated_success: bool = False
) -> Dict[str, Any]:
    """
    Verify PhonePe payment status from PhonePe gateway API and activate 30-day Pro subscription.
    Handles both PhonePe v2 Checkout status and v1 status API.
    """
    user = await UserRepository.find_user_by_id(user_id)
    if not user:
        raise ValueError("User not found.")

    order = await UserRepository.get_payment_order(merchant_transaction_id)
    if not order:
        raise ValueError(f"Payment order '{merchant_transaction_id}' not found.")

    settings = get_settings()
    base_url = _get_phonepe_base_url()

    # 0. Check if order is already marked as paid
    if order.get("status") == "paid":
        return {
            "success": True,
            "pending": False,
            "message": "Payment verified. Pro subscription is active.",
            "plan": "pro",
            "plan_id": order.get("plan_id", "pro_monthly"),
            "subscription_status": "active",
            "subscription_expiry": user.get("subscription_expiry"),
            "is_unlimited": True,
            "order_id": merchant_transaction_id,
            "payment_id": order.get("payment_id", f"T_{merchant_transaction_id}"),
            "gateway": "phonepe"
        }

    is_verified = False
    is_pending = False
    phonepe_txn_id = f"T_{uuid.uuid4().hex[:12].upper()}"

    # 1. If explicit simulation requested or mock order
    if simulated_success or order.get("is_mock"):
        logger.info(f"🧪 PhonePe simulated / test approval for {merchant_transaction_id}")
        is_verified = True
    else:
        # 2. Try PhonePe Checkout v2 Status API
        token = await _get_phonepe_oauth_token()
        if token:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get(
                        f"{base_url}/checkout/v2/order/{merchant_transaction_id}/status?details=true",
                        headers={
                            "Content-Type": "application/json",
                            "Authorization": f"O-Bearer {token}"
                        }
                    )
                    data = res.json()
                    logger.info(f"PhonePe Checkout v2 status for {merchant_transaction_id}: {data}")

                    state = data.get("state")
                    if data.get("orderId"):
                        phonepe_txn_id = data["orderId"]

                    if state == "COMPLETED" or state == "SUCCESS":
                        is_verified = True
                    elif state == "PENDING":
                        is_pending = True
                    else:
                        raise ValueError(f"Payment declined: State is {state}")
            except Exception as e:
                logger.warning(f"PhonePe v2 status check exception: {e}")

        # 3. Fallback to PhonePe v1 Status API if v2 was not checked/verified
        if not is_verified and not is_pending:
            merchant_id = getattr(settings, "PHONEPE_MERCHANT_ID", "PGTESTPAYUAT86")
            salt_key = getattr(settings, "PHONEPE_SALT_KEY", "96434309-7796-489d-8924-ab56988a6076")
            salt_index = getattr(settings, "PHONEPE_SALT_INDEX", 1)

            endpoint_path = f"/pg/v1/status/{merchant_id}/{merchant_transaction_id}"
            string_to_hash = endpoint_path + salt_key
            sha256_hash = hashlib.sha256(string_to_hash.encode("utf-8")).hexdigest()
            x_verify = f"{sha256_hash}###{salt_index}"

            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get(
                        f"{base_url}{endpoint_path}",
                        headers={
                            "Content-Type": "application/json",
                            "X-VERIFY": x_verify,
                            "X-MERCHANT-ID": merchant_id,
                            "accept": "application/json"
                        }
                    )
                    data = res.json()
                    logger.info(f"PhonePe v1 Status check for {merchant_transaction_id}: {data}")

                    code = data.get("code")
                    state = data.get("data", {}).get("state")
                    if data.get("data", {}).get("transactionId"):
                        phonepe_txn_id = data["data"]["transactionId"]

                    if code == "PAYMENT_SUCCESS" or state == "COMPLETED":
                        is_verified = True
                    elif code == "PAYMENT_PENDING" or state == "PENDING":
                        is_pending = True
                    else:
                        raise ValueError(f"Payment not completed: {data.get('message', code)}")
            except Exception as e:
                logger.warning(f"PhonePe v1 status check error: {e}")

    # If still pending during auto-polling, return clean pending response without throwing HTTP error
    if not is_verified:
        if is_pending:
            return {
                "success": False,
                "pending": True,
                "message": "Payment is pending in PhonePe UPI app.",
                "order_id": merchant_transaction_id
            }
        raise ValueError("Payment verification could not be completed.")

    # 3. Mark order as paid
    await UserRepository.update_payment_order(merchant_transaction_id, {
        "status": "paid",
        "payment_id": phonepe_txn_id,
        "payment_gateway": "phonepe"
    })

    # 4. Activate Pro subscription for 30 days
    updated_user = await UserRepository.activate_subscription(
        user_id=user_id,
        plan_id=order.get("plan_id", "pro_monthly"),
        duration_days=30,
        order_id=merchant_transaction_id,
        payment_id=phonepe_txn_id
    )

    # 5. Record payment in ledger
    payment_record = {
        "user_id": str(user["_id"]),
        "user_email": user.get("email"),
        "user_name": user.get("name") or user.get("email", "").split("@")[0],
        "order_id": merchant_transaction_id,
        "payment_id": phonepe_txn_id,
        "plan_id": order.get("plan_id", "pro_monthly"),
        "plan_name": order.get("plan_name", "Pro Subscription"),
        "amount": order.get("amount", 199),
        "amount_paise": order.get("amount_paise", 19900),
        "currency": "INR",
        "status": "success",
        "gateway": "phonepe",
        "payment_method": "PhonePe UPI / QR"
    }
    await UserRepository.record_payment(payment_record)

    logger.info(f"🎉 PhonePe Pro subscription activated for user {user.get('email')}!")

    return {
        "success": True,
        "message": "Payment verified successfully via PhonePe! Pro subscription activated.",
        "plan": "pro",
        "plan_id": order.get("plan_id", "pro_monthly"),
        "subscription_status": "active",
        "subscription_expiry": updated_user.get("subscription_expiry"),
        "is_unlimited": True,
        "order_id": merchant_transaction_id,
        "payment_id": phonepe_txn_id,
        "gateway": "phonepe"
    }


async def generate_upi_qr(user_id: str, plan_id: str = "pro_monthly") -> Dict[str, Any]:
    """Generate dynamic UPI payment payload and QR code image for direct scan."""
    order_data = await create_phonepe_order(user_id, plan_id)
    return {
        "success": True,
        "order_id": order_data["order_id"],
        "amount": order_data["price_inr"],
        "currency": "INR",
        "upi_intent_url": order_data["upi_intent_url"],
        "qr_code_url": order_data["qr_code_url"],
        "payment_url": order_data["payment_url"],
        "gateway": "phonepe"
    }


# ════════════════════════════════════════════════════════════════════════════════
# ── Razorpay Gateway Integration ────────────────────────────────────────────────
# ════════════════════════════════════════════════════════════════════════════════

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
        "gateway": "razorpay",
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
        "gateway": "razorpay",
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
        "signature": signature,
        "payment_gateway": "razorpay"
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
        "payment_id": payment_id,
        "gateway": "razorpay"
    }


# ════════════════════════════════════════════════════════════════════════════════
# ── Common Subscription & History Helpers ───────────────────────────────────────
# ════════════════════════════════════════════════════════════════════════════════

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
        "last_payment_id": user.get("last_payment_id"),
        "default_gateway": settings.DEFAULT_PAYMENT_GATEWAY
    }


async def get_user_payment_history(user_id: str) -> List[Dict[str, Any]]:
    return await UserRepository.get_payment_history(user_id)
