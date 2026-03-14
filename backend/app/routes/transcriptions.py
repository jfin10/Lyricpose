import os
import asyncio
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import settings
from app.database import get_db, async_session
from app.models import User, Transcription
from app.processing.pipeline import run_pipeline

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/transcriptions", tags=["transcriptions"])


@router.get("")
async def list_transcriptions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transcription)
        .where(Transcription.user_id == user.id)
        .order_by(Transcription.created_at.desc())
    )
    transcriptions = result.scalars().all()

    return {
        "transcriptions": [
            {
                "id": t.id,
                "filename": t.filename,
                "status": t.status,
                "created_at": t.created_at.isoformat(),
                "arrangement_style": t.arrangement_style,
                "key_signature": t.key_signature,
                "time_signature": t.time_signature,
                "tempo": t.tempo,
                "include_lyrics": t.include_lyrics,
                "include_chords": t.include_chords,
                "result": t.result,
                "error_message": t.error_message,
            }
            for t in transcriptions
        ]
    }


@router.get("/{transcription_id}")
async def get_transcription(
    transcription_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transcription).where(
            Transcription.id == transcription_id,
            Transcription.user_id == user.id,
        )
    )
    t = result.scalar_one_or_none()

    if not t:
        raise HTTPException(status_code=404, detail="Transcription not found")

    return {
        "transcription": {
            "id": t.id,
            "filename": t.filename,
            "status": t.status,
            "created_at": t.created_at.isoformat(),
            "arrangement_style": t.arrangement_style,
            "key_signature": t.key_signature,
            "time_signature": t.time_signature,
            "tempo": t.tempo,
            "include_lyrics": t.include_lyrics,
            "include_chords": t.include_chords,
            "result": t.result,
            "error_message": t.error_message,
        }
    }


@router.post("")
async def create_transcription(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    arrangement_style: str = Form("satb"),
    key_signature: str = Form("auto"),
    time_signature: str = Form("auto"),
    tempo: int = Form(120),
    include_lyrics: str = Form("true"),
    include_chords: str = Form("true"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Save uploaded file
    upload_dir = Path(settings.UPLOAD_DIR) / user.id
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / file.filename
    content = await file.read()

    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large (max {settings.MAX_FILE_SIZE_MB}MB)")

    with open(file_path, "wb") as f:
        f.write(content)

    # Create transcription record
    transcription = Transcription(
        user_id=user.id,
        filename=file.filename,
        original_path=str(file_path),
        status="processing",
        arrangement_style=arrangement_style,
        key_signature=key_signature,
        time_signature=time_signature,
        tempo=tempo,
        include_lyrics=include_lyrics.lower() == "true",
        include_chords=include_chords.lower() == "true",
    )
    db.add(transcription)
    await db.commit()
    await db.refresh(transcription)

    # Start processing in background
    background_tasks.add_task(
        process_transcription,
        transcription.id,
        str(file_path),
        arrangement_style,
        key_signature,
        time_signature,
        tempo,
        include_lyrics.lower() == "true",
        include_chords.lower() == "true",
    )

    return {
        "transcription": {
            "id": transcription.id,
            "filename": transcription.filename,
            "status": transcription.status,
            "created_at": transcription.created_at.isoformat(),
            "arrangement_style": transcription.arrangement_style,
            "key_signature": transcription.key_signature,
            "time_signature": transcription.time_signature,
            "tempo": transcription.tempo,
            "include_lyrics": transcription.include_lyrics,
            "include_chords": transcription.include_chords,
        }
    }


async def process_transcription(
    transcription_id: str,
    audio_path: str,
    arrangement_style: str,
    key_signature: str,
    time_signature: str,
    tempo: int,
    include_lyrics: bool,
    include_chords: bool,
):
    """Background task to process a transcription."""
    async with async_session() as db:
        try:
            logger.info(f"Processing transcription {transcription_id}")

            result = await run_pipeline(
                audio_path=audio_path,
                arrangement_style=arrangement_style,
                key_signature=key_signature,
                time_signature=time_signature,
                tempo=tempo,
                include_lyrics=include_lyrics,
                include_chords=include_chords,
            )

            # Update transcription with result
            db_result = await db.execute(
                select(Transcription).where(Transcription.id == transcription_id)
            )
            transcription = db_result.scalar_one_or_none()
            if transcription:
                transcription.status = "completed"
                transcription.result = result
                await db.commit()

            logger.info(f"Transcription {transcription_id} completed")

        except Exception as e:
            logger.error(f"Transcription {transcription_id} failed: {e}", exc_info=True)

            db_result = await db.execute(
                select(Transcription).where(Transcription.id == transcription_id)
            )
            transcription = db_result.scalar_one_or_none()
            if transcription:
                transcription.status = "error"
                transcription.error_message = str(e)
                await db.commit()
