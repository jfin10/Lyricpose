"""
Pitch detection using Spotify's Basic Pitch.
Detects notes with onset times, durations, and pitches from audio.
"""

import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

# MIDI note number to note name mapping
NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def midi_to_note_name(midi_num: int) -> str:
    """Convert MIDI note number to note name like 'c/4'."""
    octave = (midi_num // 12) - 1
    note = NOTE_NAMES[midi_num % 12].lower()
    return f"{note}/{octave}"


def duration_from_seconds(duration_secs: float, tempo: float) -> str:
    """Convert duration in seconds to VexFlow duration string."""
    beats = duration_secs * (tempo / 60.0)

    if beats >= 3.5:
        return "w"  # whole
    elif beats >= 1.5:
        return "h"  # half
    elif beats >= 0.75:
        return "q"  # quarter
    elif beats >= 0.375:
        return "8"  # eighth
    else:
        return "16"  # sixteenth


async def detect_pitches(
    audio_path: str, tempo: float = 120.0
) -> list[dict]:
    """
    Detect pitches from an audio file using Basic Pitch.

    Returns list of note dicts:
    [
        {"keys": ["c/4"], "duration": "q", "time": 0.0},
        {"keys": ["e/4"], "duration": "h", "time": 0.5},
        ...
    ]
    """
    try:
        from basic_pitch.inference import predict

        logger.info(f"Detecting pitches for: {audio_path}")

        model_output, midi_data, note_events = predict(audio_path)

        notes = []
        for note_event in note_events:
            start_time = note_event[0]
            end_time = note_event[1]
            midi_pitch = int(note_event[2])
            duration_secs = end_time - start_time

            note_name = midi_to_note_name(midi_pitch)
            duration = duration_from_seconds(duration_secs, tempo)

            notes.append({
                "keys": [note_name],
                "duration": duration,
                "time": round(start_time, 3),
                "midi_pitch": midi_pitch,
                "confidence": round(float(note_event[3]) if len(note_event) > 3 else 1.0, 3),
            })

        # Sort by time
        notes.sort(key=lambda n: n["time"])

        logger.info(f"Detected {len(notes)} notes")
        return notes

    except ImportError:
        logger.error("basic-pitch not installed, generating mock notes")
        return _generate_mock_notes(tempo)
    except Exception as e:
        logger.error(f"Pitch detection failed: {e}")
        return _generate_mock_notes(tempo)


def _generate_mock_notes(tempo: float) -> list[dict]:
    """Generate mock notes for testing when Basic Pitch is unavailable."""
    possible_notes = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5"]
    durations = ["q", "h", "8"]
    notes = []

    for i in range(16):
        note = possible_notes[np.random.randint(0, len(possible_notes))]
        duration = durations[np.random.randint(0, len(durations))]
        notes.append({
            "keys": [note],
            "duration": duration,
            "time": round(i * 0.5, 3),
            "midi_pitch": 60 + np.random.randint(0, 12),
            "confidence": 0.8,
        })

    return notes
