"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Music,
  Upload,
  LogOut,
  FileAudio,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TranscriptionDialog } from "@/components/transcription-dialog";
import { ResultsViewer } from "@/components/results-viewer";

interface User {
  id: string;
  name: string;
  email: string;
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

interface TranscriptionResult {
  notes: { soprano: NoteData[]; alto: NoteData[]; tenor: NoteData[]; bass: NoteData[] };
  lyrics?: { word: string; start: number; end: number }[];
  chords?: { symbol: string; time: number }[];
  key_detected: string;
  tempo_detected: number;
  time_signature_detected: string;
}

interface NoteData {
  keys: string[];
  duration: string;
  time: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [viewingResult, setViewingResult] = useState<Transcription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTranscriptions = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/transcriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTranscriptions(data.transcriptions || []);
      }
    } catch (err) {
      console.error("Failed to fetch transcriptions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    let parsed: User;
    try {
      parsed = JSON.parse(userData);
    } catch {
      router.push("/login");
      return;
    }

    setUser(parsed);
    fetchTranscriptions(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleTranscriptionCreated = (transcription: Transcription) => {
    setTranscriptions((prev) => [transcription, ...prev]);
    setShowUpload(false);

    // Poll for status updates
    const token = localStorage.getItem("token");
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/transcriptions/${transcription.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTranscriptions((prev) =>
            prev.map((t) => (t.id === transcription.id ? data.transcription : t))
          );
          if (data.transcription.status === "completed" || data.transcription.status === "error") {
            clearInterval(interval);
          }
        }
      } catch {
        clearInterval(interval);
      }
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-violet-400" />
            <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Lyricpose
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user?.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Transcriptions</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Upload audio files and get professional sheet music.
            </p>
          </div>
          <Button
            onClick={() => setShowUpload(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Transcription
          </Button>
        </div>

        {transcriptions.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-16 text-center">
            <Upload className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No transcriptions yet
            </h2>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Upload your first audio or video file to get started with AI-powered
              sheet music transcription.
            </p>
            <Button
              onClick={() => setShowUpload(true)}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Audio
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {transcriptions.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center justify-between hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <FileAudio className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{t.filename}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-zinc-500">
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                      <Separator orientation="vertical" className="h-3 bg-zinc-700" />
                      <span className="text-xs text-zinc-500 uppercase">
                        {t.arrangement_style}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={t.status} />
                  {t.status === "completed" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setViewingResult(t)}
                        className="text-zinc-400 hover:text-white hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-zinc-400 hover:text-white hover:bg-white/10"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Dialog */}
      <TranscriptionDialog
        open={showUpload}
        onOpenChange={setShowUpload}
        onCreated={handleTranscriptionCreated}
      />

      {/* Results Viewer */}
      {viewingResult && (
        <ResultsViewer
          transcription={viewingResult}
          onClose={() => setViewingResult(null)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Transcription["status"] }) {
  switch (status) {
    case "uploading":
      return (
        <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
          <Upload className="h-3 w-3 mr-1" />
          Uploading
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
          <Clock className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "error":
      return (
        <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
  }
}
