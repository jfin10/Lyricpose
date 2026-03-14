import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routes import auth, transcriptions, export

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(
    title="Lyricpose API",
    description="Audio to Sheet Music Transcription API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(transcriptions.router)
app.include_router(export.router)


@app.on_event("startup")
async def startup():
    await init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "lyricpose-api"}
