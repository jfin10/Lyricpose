"""
Lyrics detection using OpenAI Whisper.
Extracts lyrics with word-level timestamps from vocal stems.
"""

import logging

logger = logging.getLogger(__name__)


async def detect_lyrics(audio_path: str) -> list[dict]:
    """
    Detect lyrics from a vocal audio file using Whisper.

    Returns list of word dicts:
    [
        {"word": "hello", "start": 0.0, "end": 0.5},
        {"word": "world", "start": 0.6, "end": 1.1},
        ...
    ]
    """
    try:
        import whisper

        logger.info(f"Detecting lyrics for: {audio_path}")

        model = whisper.load_model("base")
        result = model.transcribe(
            audio_path,
            word_timestamps=True,
            language=None,  # auto-detect
        )

        words = []
        for segment in result.get("segments", []):
            for word_info in segment.get("words", []):
                words.append({
                    "word": word_info["word"].strip(),
                    "start": round(word_info["start"], 3),
                    "end": round(word_info["end"], 3),
                })

        logger.info(f"Detected {len(words)} words")
        return words

    except ImportError:
        logger.error("whisper not installed, returning empty lyrics")
        return []
    except Exception as e:
        logger.error(f"Lyrics detection failed: {e}")
        return []
