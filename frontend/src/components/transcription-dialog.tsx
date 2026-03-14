"use client";

import { useState, useRef } from "react";
import { Upload, FileAudio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TranscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (transcription: {
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
  }) => void;
}

export function TranscriptionDialog({
  open,
  onOpenChange,
  onCreated,
}: TranscriptionDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [arrangementStyle, setArrangementStyle] = useState("satb");
  const [keySignature, setKeySignature] = useState("auto");
  const [timeSignature, setTimeSignature] = useState("auto");
  const [tempo, setTempo] = useState(120);
  const [includeLyrics, setIncludeLyrics] = useState(true);
  const [includeChords, setIncludeChords] = useState(true);

  const handleFile = (f: File) => {
    if (!f.type.match("audio.*") && !f.type.match("video.*")) {
      setError("Please upload an audio or video file.");
      return;
    }
    setFile(f);
    setError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("arrangement_style", arrangementStyle);
      formData.append("key_signature", keySignature);
      formData.append("time_signature", timeSignature);
      formData.append("tempo", tempo.toString());
      formData.append("include_lyrics", includeLyrics.toString());
      formData.append("include_chords", includeChords.toString());

      const res = await fetch("/api/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      onCreated(data.transcription);
      setFile(null);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            New Transcription
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* File Upload */}
          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/30"
              }`}
            >
              <Upload className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
              <p className="text-zinc-300 font-medium">
                Drop your audio/video file here
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                MP3, WAV, MP4, MOV, M4A
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/30 p-4">
              <FileAudio className="h-8 w-8 text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{file.name}</p>
                <p className="text-zinc-500 text-sm">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">Arrangement</Label>
              <select
                value={arrangementStyle}
                onChange={(e) => setArrangementStyle(e.target.value)}
                className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm"
              >
                <option value="satb">SATB</option>
                <option value="ttbb">TTBB</option>
                <option value="ssaa">SSAA</option>
                <option value="mixed">Auto-detect</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">Key Signature</Label>
              <select
                value={keySignature}
                onChange={(e) => setKeySignature(e.target.value)}
                className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm"
              >
                <option value="auto">Auto-detect</option>
                <option value="C">C Major</option>
                <option value="G">G Major</option>
                <option value="D">D Major</option>
                <option value="A">A Major</option>
                <option value="E">E Major</option>
                <option value="F">F Major</option>
                <option value="Bb">Bb Major</option>
                <option value="Eb">Eb Major</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">Time Signature</Label>
              <select
                value={timeSignature}
                onChange={(e) => setTimeSignature(e.target.value)}
                className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm"
              >
                <option value="auto">Auto-detect</option>
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="6/8">6/8</option>
                <option value="2/4">2/4</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">Tempo (BPM)</Label>
              <Input
                type="number"
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
                min={40}
                max={240}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLyrics}
                onChange={(e) => setIncludeLyrics(e.target.checked)}
                className="rounded border-zinc-600 bg-zinc-800 text-violet-500"
              />
              Include lyrics
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeChords}
                onChange={(e) => setIncludeChords(e.target.checked)}
                className="rounded border-zinc-600 bg-zinc-800 text-violet-500"
              />
              Include chords
            </label>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {uploading ? "Uploading..." : "Start Transcription"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
