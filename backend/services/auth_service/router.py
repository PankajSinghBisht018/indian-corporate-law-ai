from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from services.auth_service import service
from shared.security.jwt import extract_user_from_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    company: Optional[str] = None
    role_designation: Optional[str] = None
    designation: Optional[str] = None
    purpose: Optional[str] = None
    source: Optional[str] = None
    role: Optional[str] = "user"
    captcha_token: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    role_designation: Optional[str] = None
    designation: Optional[str] = None
    purpose: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    captcha_token: Optional[str] = None


class OTPVerifyRequest(BaseModel):
    temp_token: str
    otp: str


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = "user"


class LinkedInAuthRequest(BaseModel):
    code: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    redirect_uri: Optional[str] = None


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest):
    """Register a new user account (direct access, no OTP for standard users)."""
    return await service.signup(
        email=req.email,
        password=req.password,
        name=req.name,
        company=req.company,
        role_designation=req.role_designation or req.designation,
        purpose=req.purpose,
        source=req.source,
        captcha_token=req.captcha_token,
        role=req.role or "user"
    )


@router.post("/login")
async def login(req: LoginRequest):
    """Authenticate with email and password (OTP only for Admin)."""
    return await service.login(req.email, req.password, req.captcha_token)


@router.put("/profile")
@router.patch("/profile")
async def update_profile(req: ProfileUpdateRequest, authorization: Optional[str] = Header(None)):
    """Update current user profile (name, company, designation, purpose)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing authorization token")
    user_id = extract_user_from_token(authorization.removeprefix("Bearer "))
    return await service.update_user_profile(user_id, req.dict())


@router.post("/verify-otp")
async def verify_otp(req: OTPVerifyRequest):
    """Verify OTP and get final access token (for both signup & login)."""
    return await service.verify_otp(req.temp_token, req.otp)


@router.post("/google")
async def google_auth(req: GoogleAuthRequest):
    """Authenticate or register seamlessly using Google Auth."""
    return await service.google_auth(
        credential=req.credential,
        email=req.email,
        name=req.name,
        role=req.role or "user"
    )


@router.post("/linkedin")
async def linkedin_auth(req: LinkedInAuthRequest):
    """Authenticate or register seamlessly using LinkedIn OAuth."""
    return await service.linkedin_auth(
        code=req.code,
        email=req.email,
        name=req.name,
        redirect_uri=req.redirect_uri
    )


@router.get("/linkedin/url")
async def get_linkedin_auth_url():
    """Get the LinkedIn OAuth authorization URL."""
    from shared.config.settings import get_settings
    import urllib.parse
    settings = get_settings()
    client_id = settings.LINKEDIN_CLIENT_ID
    redirect_uri = settings.LINKEDIN_REDIRECT_URI
    scope = "openid profile email"
    state = "lb_state_" + str(int(datetime.now(timezone.utc).timestamp()))
    encoded_redirect = urllib.parse.quote(redirect_uri, safe="")
    encoded_scope = urllib.parse.quote(scope, safe="")
    url = f"https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={client_id}&redirect_uri={encoded_redirect}&scope={encoded_scope}&state={state}"
    return {
        "url": url,
        "client_id": client_id,
        "redirect_uri": redirect_uri
    }


@router.get("/me")
@router.get("/profile")
async def get_me(authorization: Optional[str] = Header(None)):
    """Get the current authenticated user's profile."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    user_id = extract_user_from_token(authorization.removeprefix("Bearer "))
    user = await service.get_user_profile(user_id)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


# ── Admin User Management ──────────────────────────────────────────────────

@router.get("/admin/users/all")
async def get_all_users():
    """Admin: Get all users."""
    return await service.get_all_users()


@router.get("/admin/users/pending")
async def get_pending_users():
    """Admin: Get users."""
    return await service.get_all_users()


@router.post("/admin/users/reset-limit/{user_id}")
@router.post("/admin/users/{user_id}/reset-limit")
async def reset_user_limit(user_id: str):
    """Admin: Reset a user's daily document limit count to 0."""
    return await service.reset_user_limit(user_id)


@router.post("/admin/users/toggle-role/{user_id}")
@router.post("/admin/users/{user_id}/toggle-role")
async def toggle_user_role(user_id: str):
    """Admin: Toggle user between User and Admin role (Admin gets unlimited uploads)."""
    return await service.toggle_user_role(user_id)


@router.post("/admin/users/set-unlimited/{user_id}")
@router.post("/admin/users/{user_id}/set-unlimited")
async def set_user_unlimited(user_id: str):
    """Admin: Grant unlimited uploads to a user."""
    return await service.set_user_unlimited(user_id, True)


@router.delete("/admin/users/{user_id}")
@router.delete("/admin/users/delete/{user_id}")
async def delete_user(user_id: str):
    """Admin: Delete a user and their associated data."""
    return await service.delete_user(user_id)


@router.get("/admin/stats")
async def get_admin_stats():
    """Admin: Get platform statistics."""
    return await service.get_stats()


# ── Legacy Aliases ────────────────────────────────────────────────────────

@router.get("/admin/agents/pending")
async def legacy_get_pending_agents():
    return await service.get_all_users()


@router.get("/admin/agents/all")
async def legacy_get_all_agents():
    return await service.get_all_users()


@router.post("/admin/agents/approve/{agent_id}")
async def legacy_approve_agent(agent_id: str):
    return await service.reset_user_limit(agent_id)


@router.post("/admin/agents/reset-limit/{agent_id}")
async def legacy_reset_agent_limit(agent_id: str):
    return await service.reset_user_limit(agent_id)
