"""
Stem separation using Meta's Demucs model.
Separates audio into vocals, bass, drums, and other stems.
"""

import os
import subprocess
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


async def separate_stems(audio_path: str, output_dir: str) -> dict[str, str]:
    """
    Separate audio into stems using Demucs.
    
    Returns dict mapping stem name to file path:
    {
        "vocals": "/path/to/vocals.wav",
        "bass": "/path/to/bass.wav",
        "drums": "/path/to/drums.wav",
        "other": "/path/to/other.wav",
    }
    """
    os.makedirs(output_dir, exist_ok=True)

    try:
        logger.info(f"Separating stems for: {audio_path}")

        result = subprocess.run(
            [
                "python", "-m", "demucs",
                "--two-stems", "vocals",
                "-n", "htdemucs",
                "-o", output_dir,
                audio_path,
            ],
            capture_output=True,
            text=True,
            timeout=600,  # 10 minute timeout
        )

        if result.returncode != 0:
            logger.error(f"Demucs error: {result.stderr}")
            # Fall back to full separation
            result = subprocess.run(
                [
                    "python", "-m", "demucs",
                    "-n", "htdemucs",
                    "-o", output_dir,
                    audio_path,
                ],
                capture_output=True,
                text=True,
                timeout=600,
            )

        # Find output files
        audio_name = Path(audio_path).stem
        stems_dir = Path(output_dir) / "htdemucs" / audio_name

        stems = {}
        for stem_name in ["vocals", "bass", "drums", "other"]:
            stem_path = stems_dir / f"{stem_name}.wav"
            if stem_path.exists():
                stems[stem_name] = str(stem_path)
            else:
                logger.warning(f"Stem not found: {stem_path}")

        # If no stems found, use original audio as vocals
        if not stems:
            logger.warning("No stems found, using original audio")
            stems["vocals"] = audio_path

        logger.info(f"Separated stems: {list(stems.keys())}")
        return stems

    except subprocess.TimeoutExpired:
        logger.error("Demucs timed out")
        return {"vocals": audio_path}
    except FileNotFoundError:
        logger.error("Demucs not installed, using original audio")
        return {"vocals": audio_path}
    except Exception as e:
        logger.error(f"Stem separation failed: {e}")
        return {"vocals": audio_path}
