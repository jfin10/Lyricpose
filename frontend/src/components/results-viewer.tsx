"use client";

import { useEffect, useRef } from "react";
import { X, FileText, Music, Piano } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoteData {
  keys: string[];
  duration: string;
  time: number;
}

interface TranscriptionResult {
  notes: { soprano: NoteData[]; alto: NoteData[]; tenor: NoteData[]; bass: NoteData[] };
  lyrics?: { word: string; start: number; end: number }[];
  chords?: { symbol: string; time: number }[];
  key_detected: string;
  tempo_detected: number;
  time_signature_detected: string;
}

interface Transcription {
  id: string;
  filename: string;
  status: "uploading" | "processing" | "completed" | "error";
  created_at: string;
  arrangement_style: string;
  key_signature: string;
  time_signature: string;
  tempo: number;
  include_lyrics: boolean;
  include_chords: boolean;
  result?: TranscriptionResult;
  error_message?: string;
}

interface ResultsViewerProps {
  transcription: Transcription;
  onClose: () => void;
}

export function ResultsViewer({ transcription, onClose }: ResultsViewerProps) {
  const sopranoRef = useRef<HTMLDivElement>(null);
  const altoRef = useRef<HTMLDivElement>(null);
  const tenorRef = useRef<HTMLDivElement>(null);
  const bassRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!transcription.result) return;

    const renderPart = async (
      container: HTMLDivElement | null,
      notes: NoteData[],
      clef: string,
      partName: string
    ) => {
      if (!container) return;
      container.innerHTML = "";

      try {
        const VexFlow = await import("vexflow");
        const { Renderer, Stave, StaveNote, Voice, Formatter } = VexFlow;

        const renderer = new Renderer(container, Renderer.Backends.SVG);
        renderer.resize(800, 150);
        const context = renderer.getContext();

        const stave = new Stave(10, 20, 750);
        stave.addClef(clef).addTimeSignature(
          transcription.result?.time_signature_detected || "4/4"
        );
        stave.setContext(context).draw();

        if (notes.length === 0) {
          context.setFont("Arial", 12, "italic");
          context.fillText(`No ${partName} notes detected`, 300, 80);
          return;
        }

        // Take up to 4 notes per measure for clean rendering
        const displayNotes = notes.slice(0, 4).map(
          (n) => new StaveNote({ keys: n.keys, duration: n.duration, clef })
        );

        if (displayNotes.length > 0) {
          const voice = new Voice({ numBeats: 4, beatValue: 4 }).setStrict(false);
          voice.addTickables(displayNotes);
          new Formatter().joinVoices([voice]).format([voice], 700);
          voice.draw(context, stave);
        }
      } catch (err) {
        console.error(`Error rendering ${partName}:`, err);
        container.innerHTML = `<p class="text-zinc-500 text-sm p-4">Error rendering ${partName} notation</p>`;
      }
    };

    const result = transcription.result;
    renderPart(sopranoRef.current, result.notes.soprano, "treble", "Soprano");
    renderPart(altoRef.current, result.notes.alto, "treble", "Alto");
    renderPart(tenorRef.current, result.notes.tenor, "bass", "Tenor");
    renderPart(bassRef.current, result.notes.bass, "bass", "Bass");
  }, [transcription.result]);

  const handleExport = async (format: "pdf" | "musicxml" | "midi") => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(
        `/api/transcriptions/${transcription.id}/export?format=${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${transcription.filename}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white">{transcription.filename}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
              {transcription.result && (
                <>
                  <span>Key: {transcription.result.key_detected}</span>
                  <span>Tempo: {transcription.result.tempo_detected} BPM</span>
                  <span>Time: {transcription.result.time_signature_detected}</span>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sheet Music */}
        <div className="p-6 space-y-6">
          {transcription.result?.lyrics && transcription.result.lyrics.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
              <h3 className="text-sm font-semibold text-violet-400 mb-2">Lyrics</h3>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {transcription.result.lyrics.map((l) => l.word).join(" ")}
              </p>
            </div>
          )}

          {transcription.result?.chords && transcription.result.chords.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
              <h3 className="text-sm font-semibold text-violet-400 mb-2">Chord Progression</h3>
              <div className="flex flex-wrap gap-2">
                {transcription.result.chords.map((c, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 text-sm font-mono"
                  >
                    {c.symbol}
                  </span>
                ))}
              </div>
            </div>
          )}

          {[
            { label: "Soprano", ref: sopranoRef },
            { label: "Alto", ref: altoRef },
            { label: "Tenor", ref: tenorRef },
            { label: "Bass", ref: bassRef },
          ].map((part) => (
            <div key={part.label} className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
              <h3 className="text-sm font-semibold text-violet-400 mb-3">
                {part.label}
              </h3>
              <div ref={part.ref} className="bg-white rounded-lg min-h-[150px]" />
            </div>
          ))}
        </div>

        {/* Export */}
        <div className="flex items-center gap-3 p-6 border-t border-zinc-800">
          <Button
            onClick={() => handleExport("pdf")}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={() => handleExport("musicxml")}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-white/5"
          >
            <Music className="h-4 w-4 mr-2" />
            MusicXML
          </Button>
          <Button
            onClick={() => handleExport("midi")}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-white/5"
          >
            <Piano className="h-4 w-4 mr-2" />
            MIDI
          </Button>
          <div className="flex-1" />
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-zinc-400 hover:text-white hover:bg-white/10"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
