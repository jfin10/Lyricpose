"""
Chord detection from audio.
Uses librosa's chroma features to estimate chord progressions.
"""

import logging

import numpy as np

logger = logging.getLogger(__name__)

CHORD_TEMPLATES = {
    "C":  [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
    "Cm": [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    "D":  [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    "Dm": [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    "E":  [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
    "Em": [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
    "F":  [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    "Fm": [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    "G":  [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    "Gm": [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    "A":  [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    "Am": [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    "B":  [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
    "Bm": [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
    "Bb": [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
    "Eb": [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    "Ab": [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
}


def _match_chord(chroma_vector: np.ndarray) -> str:
    """Match a chroma vector to the closest chord template."""
    best_chord = "N"
    best_score = -1

    for chord_name, template in CHORD_TEMPLATES.items():
        template_arr = np.array(template, dtype=float)
        score = np.dot(chroma_vector, template_arr) / (
            np.linalg.norm(chroma_vector) * np.linalg.norm(template_arr) + 1e-8
        )
        if score > best_score:
            best_score = score
            best_chord = chord_name

    return best_chord


async def detect_chords(audio_path: str) -> list[dict]:
    """
    Detect chord progressions from an audio file.

    Returns list of chord dicts:
    [
        {"symbol": "C", "time": 0.0},
        {"symbol": "Am", "time": 2.0},
        ...
    ]
    """
    try:
        import librosa

        logger.info(f"Detecting chords for: {audio_path}")

        y, sr = librosa.load(audio_path, sr=22050)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=2048)

        # Analyze chords in ~1 second windows
        hop_duration = 2048 / sr
        frames_per_second = int(1.0 / hop_duration)
        window = max(frames_per_second, 1)

        chords = []
        prev_chord = None

        for i in range(0, chroma.shape[1], window):
            segment = chroma[:, i : i + window]
            avg_chroma = np.mean(segment, axis=1)
            chord = _match_chord(avg_chroma)
            time = round(i * hop_duration, 3)

            if chord != prev_chord:
                chords.append({"symbol": chord, "time": time})
                prev_chord = chord

        logger.info(f"Detected {len(chords)} chord changes")
        return chords

    except ImportError:
        logger.error("librosa not installed, returning empty chords")
        return []
    except Exception as e:
        logger.error(f"Chord detection failed: {e}")
        return []
