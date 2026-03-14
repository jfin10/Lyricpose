import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    transcriptions = relationship("Transcription", back_populates="user")


class Transcription(Base):
    __tablename__ = "transcriptions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    original_path = Column(String, nullable=False)
    status = Column(String, default="uploading")  # uploading, processing, completed, error
    arrangement_style = Column(String, default="satb")
    key_signature = Column(String, default="auto")
    time_signature = Column(String, default="auto")
    tempo = Column(Integer, default=120)
    include_lyrics = Column(Boolean, default=True)
    include_chords = Column(Boolean, default=True)
    result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transcriptions")
