import os
import re
from typing import Protocol
from pathlib import Path

class DocumentStorage(Protocol):
    async def save_document(self, user_id: str, username: str, filename: str, content: bytes) -> str:
        ...
    async def get_document(self, filepath: str) -> bytes:
        ...
    async def delete_document(self, filepath: str) -> None:
        ...


class LocalDocumentStorage:
    def __init__(self, base_dir: str = None):
        if base_dir is None:
            backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.base_dir = os.path.join(backend_root, "uploads")
        else:
            self.base_dir = base_dir

    def _sanitize_filename(self, name: str) -> str:
        name = os.path.basename(name)
        name = re.sub(r"[^a-zA-Z0-9._\-]", "_", name).lstrip(".")
        return name[:255] or "document"

    def _get_upload_dir(self, username: str, user_id: str) -> str:
        safe_username = re.sub(r"[^a-zA-Z0-9_\-]", "_", username)
        return os.path.join(self.base_dir, f"{safe_username}-{user_id}")

    async def save_document(self, user_id: str, username: str, filename: str, content: bytes) -> str:
        upload_dir = self._get_upload_dir(username, user_id)
        Path(upload_dir).mkdir(parents=True, exist_ok=True)
        safe_name = self._sanitize_filename(filename)
        filepath = os.path.join(upload_dir, safe_name)
        with open(filepath, "wb") as fh:
            fh.write(content)
        return filepath

    async def get_document(self, filepath: str) -> bytes:
        if not os.path.exists(filepath):
            backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            candidate = os.path.join(backend_root, filepath)
            if os.path.exists(candidate):
                filepath = candidate
            else:
                raise FileNotFoundError(f"File not found: {filepath}")
        with open(filepath, "rb") as fh:
            return fh.read()

    async def delete_document(self, filepath: str) -> None:
        if filepath:
            if not os.path.exists(filepath):
                backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                candidate = os.path.join(backend_root, filepath)
                if os.path.exists(candidate):
                    filepath = candidate
            if os.path.exists(filepath):
                os.remove(filepath)

def get_storage_provider() -> DocumentStorage:
    return LocalDocumentStorage()
