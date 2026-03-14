"""
Export routes for PDF, MusicXML, and MIDI formats.
"""

import io
import logging
import tempfile

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Transcription

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/transcriptions", tags=["export"])

NOTE_NAMES = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"]


def note_str_to_midi(note_str: str) -> int:
    parts = note_str.lower().split("/")
    if len(parts) != 2:
        return 60
    name = parts[0]
    try:
        octave = int(parts[1])
    except ValueError:
        octave = 4
    idx = NOTE_NAMES.index(name) if name in NOTE_NAMES else 0
    return (octave + 1) * 12 + idx


def duration_to_beats(dur: str) -> float:
    mapping = {"w": 4.0, "h": 2.0, "q": 1.0, "8": 0.5, "16": 0.25}
    return mapping.get(dur, 1.0)


@router.get("/{transcription_id}/export")
async def export_transcription(
    transcription_id: str,
    format: str = Query("midi", regex="^(pdf|musicxml|midi)$"),
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

    if t.status != "completed" or not t.result:
        raise HTTPException(status_code=400, detail="Transcription not yet completed")

    if format == "midi":
        return _export_midi(t)
    elif format == "musicxml":
        return _export_musicxml(t)
    elif format == "pdf":
        return _export_pdf(t)


def _export_midi(t: Transcription) -> StreamingResponse:
    """Export transcription as MIDI file."""
    try:
        from midiutil import MIDIFile

        midi = MIDIFile(4)  # 4 tracks for SATB
        tempo = t.result.get("tempo_detected", 120)

        parts = ["soprano", "alto", "tenor", "bass"]
        for track_idx, part_name in enumerate(parts):
            midi.addTrackName(track_idx, 0, part_name.capitalize())
            midi.addTempo(track_idx, 0, tempo)

            notes = t.result.get("notes", {}).get(part_name, [])
            for note in notes:
                midi_pitch = note_str_to_midi(note["keys"][0])
                beat_time = note.get("time", 0) * (tempo / 60.0)
                duration = duration_to_beats(note["duration"])
                midi.addNote(track_idx, 0, midi_pitch, beat_time, duration, 100)

        buffer = io.BytesIO()
        midi.writeFile(buffer)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="audio/midi",
            headers={"Content-Disposition": f'attachment; filename="{t.filename}.mid"'},
        )
    except ImportError:
        raise HTTPException(status_code=500, detail="MIDI export not available")


def _export_musicxml(t: Transcription) -> StreamingResponse:
    """Export transcription as MusicXML."""
    try:
        from music21 import stream, note, meter, key, clef

        score = stream.Score()
        time_sig = t.result.get("time_signature_detected", "4/4")
        key_sig = t.result.get("key_detected", "C")

        duration_map = {"w": 4.0, "h": 2.0, "q": 1.0, "8": 0.5, "16": 0.25}

        parts_config = [
            ("Soprano", "soprano", clef.TrebleClef()),
            ("Alto", "alto", clef.TrebleClef()),
            ("Tenor", "tenor", clef.BassClef()),
            ("Bass", "bass", clef.BassClef()),
        ]

        for part_name, part_key, part_clef in parts_config:
            part = stream.Part()
            part.partName = part_name
            part.append(part_clef)
            part.append(meter.TimeSignature(time_sig))
            part.append(key.Key(key_sig))

            notes_data = t.result.get("notes", {}).get(part_key, [])
            for n_data in notes_data:
                pitch_str = n_data["keys"][0]
                name_part = pitch_str.split("/")[0].upper().replace("#", "#")
                octave = int(pitch_str.split("/")[1]) if "/" in pitch_str else 4
                dur = duration_map.get(n_data["duration"], 1.0)

                n = note.Note(f"{name_part}{octave}")
                n.quarterLength = dur
                part.append(n)

            score.append(part)

        buffer = io.BytesIO()
        score.write("musicxml", fp=buffer)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/xml",
            headers={"Content-Disposition": f'attachment; filename="{t.filename}.musicxml"'},
        )
    except ImportError:
        raise HTTPException(status_code=500, detail="MusicXML export not available")
    except Exception as e:
        logger.error(f"MusicXML export failed: {e}")
        raise HTTPException(status_code=500, detail="MusicXML export failed")


def _export_pdf(t: Transcription) -> StreamingResponse:
    """Export transcription as PDF via music21 + lilypond."""
    try:
        from music21 import stream, note, meter, key, clef, environment

        score = stream.Score()
        time_sig = t.result.get("time_signature_detected", "4/4")
        key_sig = t.result.get("key_detected", "C")

        duration_map = {"w": 4.0, "h": 2.0, "q": 1.0, "8": 0.5, "16": 0.25}

        parts_config = [
            ("Soprano", "soprano", clef.TrebleClef()),
            ("Alto", "alto", clef.TrebleClef()),
            ("Tenor", "tenor", clef.BassClef()),
            ("Bass", "bass", clef.BassClef()),
        ]

        for part_name, part_key, part_clef in parts_config:
            part = stream.Part()
            part.partName = part_name
            part.append(part_clef)
            part.append(meter.TimeSignature(time_sig))
            part.append(key.Key(key_sig))

            notes_data = t.result.get("notes", {}).get(part_key, [])
            for n_data in notes_data:
                pitch_str = n_data["keys"][0]
                name_part = pitch_str.split("/")[0].upper().replace("#", "#")
                octave = int(pitch_str.split("/")[1]) if "/" in pitch_str else 4
                dur = duration_map.get(n_data["duration"], 1.0)

                n = note.Note(f"{name_part}{octave}")
                n.quarterLength = dur
                part.append(n)

            score.append(part)

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            score.write("lily.pdf", fp=tmp.name)
            tmp.seek(0)
            content = open(tmp.name, "rb").read()

        buffer = io.BytesIO(content)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{t.filename}.pdf"'},
        )
    except Exception as e:
        logger.error(f"PDF export failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="PDF export requires LilyPond to be installed. Try MusicXML or MIDI instead.",
        )
