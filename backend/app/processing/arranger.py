"""
SATB Arrangement Engine.
Takes detected notes from different stems and arranges them into
Soprano, Alto, Tenor, and Bass voice parts with proper voice leading.
"""

import logging
from copy import deepcopy

logger = logging.getLogger(__name__)

# Voice ranges (MIDI note numbers)
VOICE_RANGES = {
    "soprano": (60, 81),  # C4 - A5
    "alto": (55, 74),     # G3 - D5
    "tenor": (48, 67),    # C3 - G4
    "bass": (40, 60),     # E2 - C4
}

NOTE_NAMES = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"]


def note_name_to_midi(note_str: str) -> int:
    """Convert note name like 'c/4' to MIDI number."""
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


def midi_to_note_str(midi: int) -> str:
    """Convert MIDI number to note name like 'c/4'."""
    octave = (midi // 12) - 1
    note = NOTE_NAMES[midi % 12]
    return f"{note}/{octave}"


def fit_to_range(midi_pitch: int, voice: str) -> int:
    """Transpose a MIDI pitch to fit within a voice range."""
    low, high = VOICE_RANGES[voice]
    while midi_pitch < low:
        midi_pitch += 12
    while midi_pitch > high:
        midi_pitch -= 12
    return max(low, min(high, midi_pitch))


def _build_chord_tones(root_midi: int) -> list[int]:
    """Build a simple triad from a root note (root, 3rd, 5th, octave)."""
    return [root_midi, root_midi + 4, root_midi + 7, root_midi + 12]


async def arrange_satb(
    melody_notes: list[dict],
    bass_notes: list[dict],
    harmony_notes: list[dict],
    chords: list[dict],
    arrangement_style: str = "satb",
) -> dict[str, list[dict]]:
    """
    Arrange detected notes into SATB parts.

    Returns:
    {
        "soprano": [{"keys": ["c/5"], "duration": "q", "time": 0.0}, ...],
        "alto": [...],
        "tenor": [...],
        "bass": [...],
    }
    """
    logger.info(f"Arranging for {arrangement_style} with {len(melody_notes)} melody notes")

    soprano = []
    alto = []
    tenor = []
    bass = []

    # Soprano gets the melody, fitted to soprano range
    for note in melody_notes:
        midi = note.get("midi_pitch", note_name_to_midi(note["keys"][0]))
        fitted = fit_to_range(midi, "soprano")
        soprano.append({
            "keys": [midi_to_note_str(fitted)],
            "duration": note["duration"],
            "time": note["time"],
        })

    # Bass gets the bass line, or root notes from chords
    if bass_notes:
        for note in bass_notes:
            midi = note.get("midi_pitch", note_name_to_midi(note["keys"][0]))
            fitted = fit_to_range(midi, "bass")
            bass.append({
                "keys": [midi_to_note_str(fitted)],
                "duration": note["duration"],
                "time": note["time"],
            })
    else:
        # Generate bass from chord roots
        for chord in chords:
            root_name = chord["symbol"].lower().replace("m", "").replace("#", "#")
            if root_name in NOTE_NAMES:
                midi = NOTE_NAMES.index(root_name) + 48  # Bass octave
                fitted = fit_to_range(midi, "bass")
                bass.append({
                    "keys": [midi_to_note_str(fitted)],
                    "duration": "q",
                    "time": chord["time"],
                })

    # Generate inner voices (alto and tenor) from harmony or chord tones
    if harmony_notes:
        # Split harmony between alto and tenor
        for i, note in enumerate(harmony_notes):
            midi = note.get("midi_pitch", note_name_to_midi(note["keys"][0]))
            if i % 2 == 0:
                fitted = fit_to_range(midi, "alto")
                alto.append({
                    "keys": [midi_to_note_str(fitted)],
                    "duration": note["duration"],
                    "time": note["time"],
                })
            else:
                fitted = fit_to_range(midi, "tenor")
                tenor.append({
                    "keys": [midi_to_note_str(fitted)],
                    "duration": note["duration"],
                    "time": note["time"],
                })
    else:
        # Generate inner voices from soprano melody using chord tones
        for s_note in soprano:
            s_midi = note_name_to_midi(s_note["keys"][0])

            # Alto: a third below soprano
            alto_midi = fit_to_range(s_midi - 4, "alto")
            alto.append({
                "keys": [midi_to_note_str(alto_midi)],
                "duration": s_note["duration"],
                "time": s_note["time"],
            })

            # Tenor: a fifth below soprano
            tenor_midi = fit_to_range(s_midi - 7, "tenor")
            tenor.append({
                "keys": [midi_to_note_str(tenor_midi)],
                "duration": s_note["duration"],
                "time": s_note["time"],
            })

    # If bass is still empty, generate from soprano
    if not bass:
        for s_note in soprano:
            s_midi = note_name_to_midi(s_note["keys"][0])
            bass_midi = fit_to_range(s_midi - 12, "bass")
            bass.append({
                "keys": [midi_to_note_str(bass_midi)],
                "duration": s_note["duration"],
                "time": s_note["time"],
            })

    result = {
        "soprano": soprano,
        "alto": alto,
        "tenor": tenor,
        "bass": bass,
    }

    logger.info(
        f"Arranged: S={len(soprano)}, A={len(alto)}, T={len(tenor)}, B={len(bass)} notes"
    )
    return result
