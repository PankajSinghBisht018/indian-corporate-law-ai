from typing import Optional
import logging
import os
from fastapi import APIRouter, Header, HTTPException, status, BackgroundTasks
from shared.security.jwt import extract_user_from_token
from shared.database.user_repo import UserRepository
from shared.database.document_repo import DocumentRepository
from services.rag_service.ingestion_worker.tasks import _async_process_document

logger = logging.getLogger(__name__)
router = APIRouter(tags=["analysis"])


def _auth(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    return extract_user_from_token(authorization.removeprefix("Bearer "))


def _resolve_filepath(filepath: str) -> str:
    """Resolve file path across different CWDs or relative database paths."""
    if not filepath:
        return ""
    if os.path.isabs(filepath) and os.path.exists(filepath):
        return filepath
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    candidate = os.path.join(backend_root, filepath)
    if os.path.exists(candidate):
        return candidate
    if os.path.exists(filepath):
        return os.path.abspath(filepath)
    return filepath


async def _trigger(doc_id: str, authorization: Optional[str], background_tasks: BackgroundTasks) -> dict:
    user_id = _auth(authorization)
    doc = await DocumentRepository.get_document(doc_id)
    if not doc or str(doc["user_id"]) != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Document not found or access denied")

    filepath = _resolve_filepath(doc.get("filepath", ""))
    if not filepath or not os.path.exists(filepath):
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"File not found on disk: {filepath}")

    current_status = doc.get("status", "unknown")
    active_statuses = ["QUEUED", "PROCESSING", "EXTRACTING", "CHUNKING", "EMBEDDING", "INDEXING", "ANALYZING"]

    if current_status in active_statuses:
        return {"doc_id": doc_id, "status": current_status, "message": "Already processing"}

    if current_status == "COMPLETED" and doc.get("result"):
        return {"doc_id": doc_id, "status": "COMPLETED", "message": "Analysis already complete", **_format_result(doc["result"])}

    background_tasks.add_task(_async_process_document, user_id, doc_id, filepath, doc["filename"])
    await DocumentRepository.update_document_status(doc_id, "QUEUED")
    logger.info(f"[OK] doc_id={doc_id} -> QUEUED")
    return {"doc_id": doc_id, "status": "QUEUED", "message": "Analysis queued"}


@router.post("/summarize/{doc_id}")
async def trigger_analysis(doc_id: str, background_tasks: BackgroundTasks, authorization: Optional[str] = Header(None)):
    """Trigger RAG analysis. Returns immediately; poll GET /result/{doc_id}."""
    return await _trigger(doc_id, authorization, background_tasks)


@router.post("/api/summarize/{doc_id}")
async def trigger_analysis_compat(doc_id: str, background_tasks: BackgroundTasks, authorization: Optional[str] = Header(None)):
    return await _trigger(doc_id, authorization, background_tasks)


@router.get("/result/{doc_id}")
async def get_result(doc_id: str, background_tasks: BackgroundTasks, authorization: Optional[str] = Header(None)):
    return await _result_response(doc_id, authorization, background_tasks)


@router.get("/summarize/{doc_id}")
async def get_result_compat(doc_id: str, background_tasks: BackgroundTasks, authorization: Optional[str] = Header(None)):
    return await _result_response(doc_id, authorization, background_tasks)


@router.get("/api/summarize/{doc_id}")
async def get_result_api_compat(doc_id: str, background_tasks: BackgroundTasks, authorization: Optional[str] = Header(None)):
    return await _result_response(doc_id, authorization, background_tasks)


@router.post("/api/documents/{doc_id}/cancel")
async def cancel_analysis(doc_id: str, authorization: Optional[str] = Header(None)):
    user_id = _auth(authorization)
    doc = await DocumentRepository.get_document(doc_id)
    if not doc or str(doc["user_id"]) != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Document not found or access denied")

    current_status = doc.get("status", "unknown")
    active_statuses = ["QUEUED", "PROCESSING", "EXTRACTING", "CHUNKING", "EMBEDDING", "INDEXING", "ANALYZING"]

    if current_status in active_statuses:
        await DocumentRepository.update_document_status(doc_id, "CANCELLED")
        return {"success": True, "message": "Analysis cancelled successfully"}

    return {"success": False, "message": f"Document is not currently processing (status: {current_status})"}


async def _result_response(doc_id: str, authorization: Optional[str], background_tasks: Optional[BackgroundTasks] = None) -> dict:
    user_id = _auth(authorization)
    doc = await DocumentRepository.get_document(doc_id)
    if not doc or str(doc["user_id"]) != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Document not found or access denied")

    doc_status = doc.get("status", "unknown")

    # Self-healing auto-trigger: if document is in UPLOADED state, start analysis now!
    if doc_status == "UPLOADED" and background_tasks:
        filepath = _resolve_filepath(doc.get("filepath", ""))
        if filepath and os.path.exists(filepath):
            logger.info(f"[AUTO-TRIGGER] Document {doc_id} was stuck in UPLOADED state; auto-starting analysis.")
            background_tasks.add_task(_async_process_document, user_id, doc_id, filepath, doc.get("filename", "document"))
            await DocumentRepository.update_document_status(doc_id, "QUEUED")
            return {"doc_id": doc_id, "status": "QUEUED"}

    if doc_status == "COMPLETED":
        result = doc.get("result") or {}
        return {"doc_id": doc_id, "status": "COMPLETED", **_format_result(result)}

    if doc_status == "FAILED":
        return {"doc_id": doc_id, "status": "FAILED", "error": "Analysis failed. Re-upload the document and try again."}

    return {"doc_id": doc_id, "status": doc_status}


def _format_result(result: dict) -> dict:
    return {
        "summary":     result.get("summary", ""),
        "clauses":     result.get("clauses", []),
        "obligations": result.get("obligations", []),
        "risks":       result.get("risks", []),
        "risk_score":  result.get("risk_score", 0),
        "critical_risks": result.get("critical_risks", ""),
        "compliance":  result.get("compliance", ""),
    }
