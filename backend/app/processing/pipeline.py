"""
Main transcription pipeline.
Orchestrates stem separation, pitch detection, lyrics, chords, and arrangement.
"""

import logging
import os
import tempfile

from app.processing.separator import separate_stems
from app.processing.pitch_detector import detect_pitches
from app.processing.lyrics_detector import detect_lyrics
from app.processing.chord_detector import detect_chords
from app.processing.arranger import arrange_satb

logger = logging.getLogger(__name__)


async def run_pipeline(
    audio_path: str,
    arrangement_style: str = "satb",
    key_signature: str = "auto",
    time_signature: str = "auto",
    tempo: int = 120,
    include_lyrics: bool = True,
    include_chords: bool = True,
) -> dict:
    """
    Run the full transcription pipeline on an audio file.

    Returns the complete transcription result dict.
    """
    logger.info(f"Starting pipeline for: {audio_path}")

    stems_dir = tempfile.mkdtemp(prefix="lyricpose_stems_")

    try:
        # Step 1: Separate stems
        logger.info("Step 1: Separating stems...")
        stems = await separate_stems(audio_path, stems_dir)

        vocals_path = stems.get("vocals", audio_path)
        bass_path = stems.get("bass")
        other_path = stems.get("other")

        # Step 2: Detect pitches from each stem
        logger.info("Step 2: Detecting pitches...")
        melody_notes = await detect_pitches(vocals_path, tempo)

        bass_notes = []
        if bass_path:
            bass_notes = await detect_pitches(bass_path, tempo)

        harmony_notes = []
        if other_path:
            harmony_notes = await detect_pitches(other_path, tempo)

        # Step 3: Detect lyrics from vocals
        lyrics = []
        if include_lyrics:
            logger.info("Step 3: Detecting lyrics...")
            lyrics = await detect_lyrics(vocals_path)

        # Step 4: Detect chords
        chord_progression = []
        if include_chords:
            logger.info("Step 4: Detecting chords...")
            chord_progression = await detect_chords(audio_path)

        # Step 5: Arrange into SATB
        logger.info("Step 5: Arranging SATB...")
        arranged = await arrange_satb(
            melody_notes=melody_notes,
            bass_notes=bass_notes,
            harmony_notes=harmony_notes,
            chords=chord_progression,
            arrangement_style=arrangement_style,
        )

        # Step 6: Detect key and time signature if auto
        key_detected = key_signature if key_signature != "auto" else _detect_key(melody_notes)
        time_sig_detected = time_signature if time_signature != "auto" else "4/4"
        tempo_detected = tempo

        result = {
            "notes": arranged,
            "lyrics": lyrics,
            "chords": chord_progression,
            "key_detected": key_detected,
            "tempo_detected": tempo_detected,
            "time_signature_detected": time_sig_detected,
        }

        logger.info("Pipeline completed successfully")
        return result

    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        raise


def _detect_key(notes: list[dict]) -> str:
    """Simple key detection based on note frequency distribution."""
    if not notes:
        return "C"

    note_counts = {}
    for note in notes:
        key = note["keys"][0].split("/")[0].upper()
        note_counts[key] = note_counts.get(key, 0) + 1

    # Major key profiles (simplified)
    key_profiles = {
        "C": ["C", "D", "E", "F", "G", "A", "B"],
        "G": ["G", "A", "B", "C", "D", "E", "F#"],
        "D": ["D", "E", "F#", "G", "A", "B", "C#"],
        "A": ["A", "B", "C#", "D", "E", "F#", "G#"],
        "E": ["E", "F#", "G#", "A", "B", "C#", "D#"],
        "F": ["F", "G", "A", "Bb", "C", "D", "E"],
        "Bb": ["Bb", "C", "D", "Eb", "F", "G", "A"],
        "Eb": ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
    }

    best_key = "C"
    best_score = 0

    for key, scale_notes in key_profiles.items():
        score = sum(note_counts.get(n, 0) for n in scale_notes)
        if score > best_score:
            best_score = score
            best_key = key

    return best_key
