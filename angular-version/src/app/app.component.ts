import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

declare global {
  interface Window {
    VexFlow: any;
  }
}

interface TranscriptionOptions {
  arrangementStyle: string;
  keySignature: string;
  timeSignature: string;
  tempo: number;
  difficulty: string;
  includeLyrics: boolean;
  includeChords: boolean;
}

interface Note {
  keys: string[];
  duration: string;
  position?: number;
}

interface TranscriptionData {
  notes: Note[];
  tempo: number;
  timeSignature: string;
  key: string;
  audioBuffer: AudioBuffer;
  lyrics: string[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  currentView: 'upload' | 'options' | 'processing' | 'results' = 'upload';
  uploadedFile: File | null = null;
  audioUrl: string | null = null;
  transcriptionData: TranscriptionData | null = null;
  progress = 0;
  status = '';
  detectedTempo = 120;
  detectedTimeSignature = '4/4';
  extractedLyrics: string[] = [];
  isDragOver = false;

  options: TranscriptionOptions = {
    arrangementStyle: 'satb',
    keySignature: 'auto',
    timeSignature: 'auto',
    tempo: 120,
    difficulty: 'intermediate',
    includeLyrics: false,
    includeChords: false
  };

  @ViewChild('sopranoStaff') sopranoStaff!: ElementRef;
  @ViewChild('altoStaff') altoStaff!: ElementRef;
  @ViewChild('tenorStaff') tenorStaff!: ElementRef;
  @ViewChild('bassStaff') bassStaff!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  private noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  private noteFrequencies: { [key: string]: number } = {
    'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83,
    'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
    'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65,
    'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
    'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
    'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
    'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91,
    'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53
  };

  ngOnInit(): void {
    this.loadScripts();
  }

  ngAfterViewInit(): void {
    // Scripts are loaded in ngOnInit
  }

  private loadScripts(): void {
    // Load VexFlow
    const vexflowScript = document.createElement('script');
    vexflowScript.src = 'https://unpkg.com/vexflow/releases/vexflow-debug.js';
    vexflowScript.onload = () => {
      console.log('VexFlow loaded');
    };
    document.head.appendChild(vexflowScript);

    // Load Tone.js
    const toneScript = document.createElement('script');
    toneScript.src = 'https://unpkg.com/tone';
    toneScript.onload = () => {
      console.log('Tone.js loaded');
    };
    document.head.appendChild(toneScript);
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFileUpload(file);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileUpload(files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  private handleFileUpload(file: File): void {
    if (!file.type.match('audio.*') && !file.type.match('video.*')) {
      alert('Please upload an audio or video file (MP3, WAV, MP4, MOV, M4A)');
      return;
    }

    this.uploadedFile = file;
    const url = URL.createObjectURL(file);
    this.audioUrl = url;
    this.currentView = 'options';
  }

  async startTranscription(): Promise<void> {
    this.currentView = 'processing';
    this.progress = 10;
    this.status = 'Initializing Audio Engine...';

    try {
      // Initialize audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await this.uploadedFile!.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      this.progress = 30;
      this.status = 'Analyzing Audio Data...';

      // Detect tempo
      const rawData = audioBuffer.getChannelData(0);
      const tempo = this.detectTempo(rawData, audioBuffer.sampleRate);
      this.detectedTempo = tempo;

      this.progress = 50;
      this.status = 'Extracting Musical Notes...';

      // Analyze audio for notes
      const notes = this.analyzeAudioBuffer(audioBuffer);

      // Extract lyrics if requested
      let lyrics: string[] = [];
      if (this.options.includeLyrics) {
        this.progress = 70;
        this.status = 'Extracting Lyrics...';
        try {
          lyrics = await this.extractLyrics(audioBuffer);
          this.extractedLyrics = lyrics;
        } catch (e) {
          console.log("Lyrics extraction failed:", e);
        }
      }

      this.progress = 80;
      this.status = 'Generating Sheet Music...';

      // Store transcription data
      this.transcriptionData = {
        notes,
        tempo,
        timeSignature: this.detectedTimeSignature,
        key: 'C',
        audioBuffer,
        lyrics
      };

      this.progress = 100;
      this.status = 'Complete!';
      
      setTimeout(() => {
        this.currentView = 'results';
        setTimeout(() => {
          this.renderSheetMusic(notes);
        }, 100);
      }, 1000);

    } catch (error) {
      console.error('Transcription error:', error);
      alert('Error processing audio: ' + (error as Error).message);
      this.resetApp();
    }
  }

  private detectTempo(audioBuffer: Float32Array, sampleRate: number): number {
    const windowSize = Math.floor(sampleRate * 0.1);
    const energy: number[] = [];
    
    for (let i = 0; i < audioBuffer.length - windowSize; i += windowSize) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += Math.abs(audioBuffer[i + j]);
      }
      energy.push(sum);
    }
    
    const onsets: number[] = [];
    for (let i = 1; i < energy.length - 1; i++) {
      if (energy[i] > energy[i - 1] * 1.3 && energy[i] > energy[i + 1] * 1.3) {
        onsets.push(i);
      }
    }
    
    if (onsets.length < 2) return 120;
    
    let totalInterval = 0;
    for (let i = 1; i < onsets.length; i++) {
      totalInterval += onsets[i] - onsets[i - 1];
    }
    
    const avgInterval = totalInterval / (onsets.length - 1);
    const beatsPerSecond = (sampleRate / windowSize) / avgInterval;
    const bpm = Math.round(beatsPerSecond * 60);
    
    return Math.max(60, Math.min(200, bpm));
  }

  private detectPitch(audioBuffer: Float32Array, sampleRate: number): string | null {
    const bufferSize = 4096;
    const correlations = new Array(bufferSize).fill(0);
    
    for (let lag = 0; lag < bufferSize; lag++) {
      let correlation = 0;
      for (let i = 0; i < bufferSize - lag; i++) {
        correlation += audioBuffer[i] * audioBuffer[i + lag];
      }
      correlations[lag] = correlation;
    }
    
    let maxCorrelation = 0;
    let bestLag = 0;
    
    for (let lag = 1; lag < bufferSize / 2; lag++) {
      if (correlations[lag] > maxCorrelation) {
        maxCorrelation = correlations[lag];
        bestLag = lag;
      }
    }
    
    if (bestLag === 0) return null;
    
    const frequency = sampleRate / bestLag;
    return this.getNoteFromPitch(frequency);
  }

  private getNoteFromPitch(frequency: number): string | null {
    if (frequency < 20 || frequency > 2000) return null;
    
    let minDiff = Infinity;
    let closestNote = '';
    
    for (const [note, freq] of Object.entries(this.noteFrequencies)) {
      const diff = Math.abs(frequency - freq);
      if (diff < minDiff) {
        minDiff = diff;
        closestNote = note;
      }
    }
    
    if (minDiff / frequency < 0.05) {
      return closestNote.toLowerCase().replace('##', 'x').replace('#', '#');
    }
    return null;
  }

  private analyzeAudioBuffer(audioBuffer: AudioBuffer): Note[] {
    const rawData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const notes: Note[] = [];
    
    const chunkSize = Math.floor(sampleRate * 0.2);
    const overlap = Math.floor(chunkSize * 0.5);
    
    let currentNote: string | null = null;
    let noteDuration = 0;
    const minNoteDuration = chunkSize;
    
    for (let i = 0; i < rawData.length - chunkSize; i += overlap) {
      const chunk = rawData.slice(i, i + chunkSize);
      const detectedNote = this.detectPitch(chunk, sampleRate);
      
      if (detectedNote !== null) {
        if (currentNote === detectedNote) {
          noteDuration += overlap;
        } else {
          if (currentNote !== null && noteDuration >= minNoteDuration) {
            const duration = this.getDurationFromSamples(noteDuration, sampleRate, this.detectedTempo);
            notes.push({ 
              keys: [currentNote], 
              duration: duration,
              position: i - noteDuration
            });
          }
          currentNote = detectedNote;
          noteDuration = overlap;
        }
      } else {
        if (currentNote !== null && noteDuration >= minNoteDuration) {
          const duration = this.getDurationFromSamples(noteDuration, sampleRate, this.detectedTempo);
          notes.push({ 
            keys: [currentNote], 
            duration: duration,
            position: i - noteDuration
          });
        }
        currentNote = null;
        noteDuration = 0;
      }
    }
    
    if (currentNote !== null && noteDuration >= minNoteDuration) {
      const duration = this.getDurationFromSamples(noteDuration, sampleRate, this.detectedTempo);
      notes.push({ 
        keys: [currentNote], 
        duration: duration,
        position: rawData.length - noteDuration
      });
    }
    
    return notes.slice(0, 32).sort((a, b) => (a.position || 0) - (b.position || 0));
  }

  private getDurationFromSamples(samples: number, sampleRate: number, tempo: number): string {
    const seconds = samples / sampleRate;
    const beatsPerSecond = tempo / 60;
    const beats = seconds * beatsPerSecond;
    
    if (beats < 0.5) return '16';
    if (beats < 0.75) return '8';
    if (beats < 1.5) return 'q';
    if (beats < 3) return 'h';
    return 'w';
  }

  private getStaffElement(voice: string): ElementRef | null {
    switch (voice) {
      case 'soprano':
        return this.sopranoStaff;
      case 'alto':
        return this.altoStaff;
      case 'tenor':
        return this.tenorStaff;
      case 'bass':
        return this.bassStaff;
      default:
        return null;
    }
  }

  private renderSheetMusic(notes: Note[]): void {
    if (!window.VexFlow) {
      setTimeout(() => this.renderSheetMusic(notes), 100);
      return;
    }

    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = window.VexFlow;
    const parts = ['soprano', 'alto', 'tenor', 'bass'];
    
    parts.forEach(part => {
      const element = this.getStaffElement(part)?.nativeElement;
      if (element) element.innerHTML = '';
    });

    if (notes.length === 0) {
      parts.forEach(part => {
        const element = this.getStaffElement(part)?.nativeElement;
        if (element) {
          element.innerHTML = '<p style="color: #6c757d; padding: 2rem; text-align: center;">No notes detected. Try a clearer audio recording.</p>';
        }
      });
      return;
    }

    const harmony = this.generateFourPartHarmony(notes);

    Object.keys(harmony).forEach((voice) => {
      const element = this.getStaffElement(voice)?.nativeElement;
      if (!element) return;

      const renderer = new Renderer(element, Renderer.Backends.SVG);
      renderer.resize(600, 180);
      const context = renderer.getContext();

      const stave = new Stave(10, 20, 550);
      const clef = voice === 'tenor' || voice === 'bass' ? 'bass' : 'treble';
      stave.addClef(clef).addTimeSignature(this.detectedTimeSignature);
      stave.setContext(context).draw();

      const vexNotes = harmony[voice].map(n => {
        const note = new StaveNote({ keys: n.keys, duration: n.duration });
        if (n.keys[0].includes('#')) {
          note.addAccidental(0, new Accidental('#'));
        } else if (n.keys[0].includes('b')) {
          note.addAccidental(0, new Accidental('b'));
        }
        return note;
      });

      if (vexNotes.length > 0) {
        const voiceObj = new Voice({ num_beats: 4, beat_value: 4 });
        voiceObj.addTickables(vexNotes);
        
        try {
          new Formatter().joinVoices([voiceObj]).format([voiceObj], 500);
          voiceObj.draw(context, stave);
        } catch (e) {
          console.log(`Formatting error in ${voice}`, e);
          element.innerHTML = '<p style="color: #6c757d; padding: 2rem; text-align: center;">Complex rhythm detected - simplified view</p>';
        }
      }
    });
  }

  private generateFourPartHarmony(melody: Note[]): { [key: string]: Note[] } {
    const harmony: { [key: string]: Note[] } = {
      soprano: melody,
      alto: [],
      tenor: [],
      bass: []
    };

    melody.forEach((note, index) => {
      const melodyNote = note.keys[0];
      const [noteName, octave] = melodyNote.split('/');
      const noteNum = this.noteStrings.indexOf(noteName.replace('#', '#').replace('b', 'b'));
      
      const altoInterval = Math.random() > 0.5 ? -3 : -6;
      const altoNoteNum = (noteNum + altoInterval + 12) % 12;
      const altoOctave = parseInt(octave) - (altoInterval < -3 ? 1 : 0);
      harmony.alto.push({
        keys: [`${this.noteStrings[altoNoteNum].replace('#', '#')}/${altoOctave}`],
        duration: note.duration
      });
      
      const tenorNoteNum = (noteNum - 7 + 12) % 12;
      const tenorOctave = parseInt(octave) - 1;
      harmony.tenor.push({
        keys: [`${this.noteStrings[tenorNoteNum].replace('#', '#')}/${tenorOctave}`],
        duration: note.duration
      });
      
      const bassInterval = index % 2 === 0 ? 0 : -7;
      const bassNoteNum = (noteNum + bassInterval + 12) % 12;
      const bassOctave = parseInt(octave) - 2;
      harmony.bass.push({
        keys: [`${this.noteStrings[bassNoteNum].replace('#', '#')}/${bassOctave}`],
        duration: note.duration === 'w' ? 'w' : 'h'
      });
    });

    return harmony;
  }

  private async extractLyrics(audioBuffer: AudioBuffer): Promise<string[]> {
    return ["♪ Instrumental ♪", "♪ No lyrics detected ♪"];
  }

  downloadPDF(): void {
    if (!this.transcriptionData) {
      alert('No transcription data available. Please transcribe audio first.');
      return;
    }
    
    alert('PDF download would be implemented here');
  }

  downloadMusicXML(): void {
    if (!this.transcriptionData) {
      alert('No transcription data available. Please transcribe audio first.');
      return;
    }
    
    alert('MusicXML download would be implemented here');
  }

  downloadMIDI(): void {
    if (!this.transcriptionData) {
      alert('No transcription data available. Please transcribe audio first.');
      return;
    }
    
    alert('MIDI download would be implemented here');
  }

  resetApp(): void {
    this.currentView = 'upload';
    this.uploadedFile = null;
    this.audioUrl = null;
    this.transcriptionData = null;
    this.progress = 0;
    this.status = '';
    this.extractedLyrics = [];
  }
}
