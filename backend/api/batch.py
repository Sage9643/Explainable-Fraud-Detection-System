"""
Batch prediction endpoints.

Thin controllers: validate the upload (type, size), delegate scoring/lookup
entirely to batch_service. No pandas/model logic lives here.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from schemas.batch import BatchPredictResponse
from services.batch_service import get_batch_download, score_batch
from services.model_service import model_service
from utils.config import get_settings
from utils.exceptions import InvalidTransactionError

router = APIRouter(tags=["batch"])


@router.post("/api/batch/predict", response_model=BatchPredictResponse)
async def predict_batch(file: UploadFile = File(...)) -> BatchPredictResponse:
    settings = get_settings()

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds the maximum upload size of {settings.max_upload_size_mb} MB.",
        )

    try:
        result = score_batch(file_bytes, model_service)
    except InvalidTransactionError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc

    return BatchPredictResponse(**result)


@router.get("/api/batch/{batch_id}/download")
def download_batch(batch_id: str):
    result = get_batch_download(batch_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Batch not found.")

    file_path, created_at = result
    timestamp = datetime.fromisoformat(created_at).strftime("%Y%m%d_%H%M%S")
    download_name = f"FraudLens_Batch_{timestamp}.csv"

    return FileResponse(path=file_path, media_type="text/csv", filename=download_name)