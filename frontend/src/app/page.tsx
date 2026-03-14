import Link from "next/link";
import { AnimatedStaffBackground } from "@/components/animated-staff-background";
import { Music, Mic2, FileMusic, Sparkles, ArrowRight, Zap, Shield, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <AnimatedStaffBackground />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2">
          <Music className="h-7 w-7 text-violet-400" />
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            Lyricpose
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-white/10">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white">
              Get Started
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-32 md:pt-32 md:pb-40">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm mb-8">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Music Transcription
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1]">
          <span className="text-white">Turn any song into </span>
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            sheet music
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed">
          Upload audio or video files and get professional four-part SATB sheet music
          with lyrics, chords, and notation — all powered by state-of-the-art AI.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Link href="/signup">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white px-8 h-12 text-base">
              Start Transcribing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-white/5 px-8 h-12 text-base">
              See How It Works
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-12 mt-16 text-center">
          {[
            { value: "4-Part", label: "SATB Arrangement" },
            { value: "99%", label: "Pitch Accuracy" },
            { value: "<2min", label: "Processing Time" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 md:px-12 pb-32">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Everything you need
          </h2>
          <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
            From raw audio to performance-ready sheet music in minutes.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Mic2 className="h-6 w-6" />,
                title: "Stem Separation",
                description:
                  "AI isolates vocals, bass, drums, and instruments from any mix using Meta's Demucs model.",
              },
              {
                icon: <FileMusic className="h-6 w-6" />,
                title: "Lyrics Detection",
                description:
                  "OpenAI Whisper extracts lyrics with precise word-level timestamps aligned to the notation.",
              },
              {
                icon: <Sparkles className="h-6 w-6" />,
                title: "Pitch Detection",
                description:
                  "Spotify's Basic Pitch neural network detects every note with polyphonic accuracy.",
              },
              {
                icon: <Music className="h-6 w-6" />,
                title: "SATB Arrangement",
                description:
                  "Automatically arranges detected parts into Soprano, Alto, Tenor, and Bass voices.",
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Chord Analysis",
                description:
                  "Detects chord progressions and annotates them above the staff for easy reading.",
              },
              {
                icon: <Download className="h-6 w-6" />,
                title: "Export Anywhere",
                description:
                  "Download as PDF, MusicXML (for Finale/Sibelius/MuseScore), or MIDI for your DAW.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 hover:border-violet-500/50 transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-12 pb-20">
        <div className="max-w-3xl mx-auto text-center rounded-2xl border border-zinc-800 bg-gradient-to-br from-violet-950/40 to-zinc-900/80 backdrop-blur-sm p-12">
          <Shield className="h-8 w-8 text-violet-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-3">
            Ready to transcribe?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">
            Create a free account to start turning your favorite songs into
            professional sheet music.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-white px-10 h-12 text-base">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-violet-400" />
            <span className="text-sm font-semibold text-zinc-400">Lyricpose</span>
          </div>
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} Lyricpose. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
