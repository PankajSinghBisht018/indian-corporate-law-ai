from typing import Optional
from datetime import datetime, timezone, timedelta
from bson.objectid import ObjectId
from shared.database.mongo import DatabaseManager

class UserRepository:
    @staticmethod
    def get_collection():
        return DatabaseManager.get_db().users

    @classmethod
    async def create_user(
        cls, 
        email: str, 
        password_hash: Optional[str] = None, 
        role: str = "user", 
        status: str = "approved", 
        company: Optional[str] = None, 
        is_new_to_ai: bool = False, 
        purpose: Optional[str] = None, 
        source: Optional[str] = None,
        name: Optional[str] = None,
        role_designation: Optional[str] = None,
        designation: Optional[str] = None,
        auth_provider: str = "local"
    ) -> dict:
        doc = {
            "email": email.strip().lower(),
            "name": name or email.split("@")[0],
            "company": company,
            "role_designation": role_designation or designation or "IT Professional",
            "designation": designation or role_designation or "IT Professional",
            "is_new_to_ai": is_new_to_ai,
            "purpose": purpose,
            "source": source,
            "password_hash": password_hash,
            "role": role,
            "status": status,
            "auth_provider": auth_provider,
            "subscription_tier": "free",
            "subscription_expiry": None,
            "daily_doc_count": 0,
            "last_reset_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        result = await cls.get_collection().insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    @classmethod
    async def find_user_by_email(cls, email: str) -> Optional[dict]:
        return await cls.get_collection().find_one({"email": email.strip().lower()})

    @classmethod
    async def find_user_by_id(cls, user_id: str) -> Optional[dict]:
        return await cls.get_collection().find_one({"_id": ObjectId(user_id)})

    @classmethod
    async def delete_user(cls, user_id: str) -> bool:
        coll = cls.get_collection()
        res = await coll.delete_one({"_id": ObjectId(user_id)})
        return res.deleted_count > 0

    @classmethod
    async def get_all_users(cls) -> list:
        # Fetch all registered accounts (both user and legacy agent roles)
        cursor = cls.get_collection().find().sort("created_at", -1)
        return await cursor.to_list(length=1000)

    @classmethod
    async def get_pending_users(cls) -> list:
        cursor = cls.get_collection().find({"status": {"$in": ["pending", "pending_verification"]}}).sort("created_at", -1)
        return await cursor.to_list(length=200)

    # Legacy agent aliases for backward compatibility
    @classmethod
    async def get_all_agents(cls) -> list:
        return await cls.get_all_users()

    @classmethod
    async def get_pending_agents(cls) -> list:
        return await cls.get_pending_users()

    @classmethod
    async def approve_user(cls, user_id: str, password_hash: Optional[str] = None) -> None:
        update_data = {"status": "approved", "updated_at": datetime.now(timezone.utc)}
        if password_hash:
            update_data["password_hash"] = password_hash
        await cls.get_collection().update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )

    @classmethod
    async def approve_agent(cls, user_id: str, password_hash: str) -> None:
        await cls.approve_user(user_id, password_hash)

    @classmethod
    async def update_user(cls, user_id: str, data: dict) -> None:
        data["updated_at"] = datetime.now(timezone.utc)
        await cls.get_collection().update_one(
            {"_id": ObjectId(user_id)},
            {"$set": data}
        )

    @classmethod
    async def save_otp(cls, user_id: str, otp: str, expiry: datetime) -> None:
        await cls.get_collection().update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"otp": otp, "otp_expiry": expiry}}
        )

    @classmethod
    async def clear_otp(cls, user_id: str) -> None:
        await cls.get_collection().update_one(
            {"_id": ObjectId(user_id)},
            {"$unset": {"otp": "", "otp_expiry": ""}}
        )

    @classmethod
    async def get_all_users_stats(cls) -> dict:
        coll = cls.get_collection()
        total = await coll.count_documents({})
        approved = await coll.count_documents({"status": {"$in": ["approved", "active"]}})
        pending = await coll.count_documents({"status": {"$in": ["pending", "pending_verification"]}})
        admins = await coll.count_documents({"role": "admin"})
        users = await coll.count_documents({"role": {"$ne": "admin"}})
        tiers = {
            "free": await coll.count_documents({"subscription_tier": "free"}),
            "basic": await coll.count_documents({"subscription_tier": "basic"}),
            "professional": await coll.count_documents({"subscription_tier": "professional"}),
        }
        return {
            "total": total,
            "approved": approved,
            "pending": pending,
            "admins": admins,
            "users": users,
            "tiers": tiers
        }

    @classmethod
    async def get_all_agents_stats(cls) -> dict:
        return await cls.get_all_users_stats()

    @classmethod
    async def increment_daily_doc_count(cls, user_id: str, current_date: str) -> Optional[dict]:
        coll = cls.get_collection()
        user = await coll.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None
        if user.get("last_reset_date") != current_date:
            update_data = {"$set": {"daily_doc_count": 1, "last_reset_date": current_date}}
        else:
            update_data = {"$inc": {"daily_doc_count": 1}}
        await coll.update_one({"_id": ObjectId(user_id)}, update_data)
        return await coll.find_one({"_id": ObjectId(user_id)})
