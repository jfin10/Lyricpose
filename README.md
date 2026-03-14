# Lyricpose

AI-powered audio to sheet music transcriber. Upload any song and get professional four-part SATB sheet music with lyrics, chords, and notation.

## Architecture

- **Frontend**: Next.js 15 + TailwindCSS + shadcn/ui + VexFlow
- **Backend**: FastAPI + Demucs (stem separation) + Whisper (lyrics) + Basic Pitch (notes) + librosa (chords)
- **Deployment**: Docker Compose, designed for Coolify on a VPS

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env with a real SECRET_KEY
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (required) | JWT signing key |
| `WHISPER_MODEL` | `base` | Whisper model size: tiny, base, small, medium, large |
| `MAX_FILE_SIZE_MB` | `100` | Max upload file size |
| `BACKEND_URL` | `http://localhost:8000` | Backend URL (frontend env) |

## Processing Pipeline

1. **Demucs** - Separates audio into vocals, bass, drums, other stems
2. **Basic Pitch** - Detects pitches/notes from each stem
3. **Whisper** - Extracts lyrics with word-level timestamps from vocals
4. **Chord Detection** - Analyzes chroma features for chord progressions
5. **SATB Arranger** - Arranges parts into Soprano, Alto, Tenor, Bass
6. **VexFlow** - Renders notation in the browser

## Export Formats

- **PDF** - Printable sheet music (requires LilyPond)
- **MusicXML** - Import into Finale, Sibelius, MuseScore
- **MIDI** - Use with DAWs and virtual instruments

## License

MIT
