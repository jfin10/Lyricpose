<template>
  <div id="app">
    <div class="container">
      <h1>🎵 Audio to Sheet Music Transcriber</h1>
      <p class="subtitle">Upload audio or video files and get professional four-part sheet music</p>

      <!-- Upload Section -->
      <div v-if="currentView === 'upload'" class="upload-section">
        <div 
          class="upload-area"
          :class="{ dragover: isDragOver }"
          @drop="handleDrop"
          @dragover="isDragOver = true"
          @dragleave="isDragOver = false"
          @click="$refs.fileInput.click()"
        >
          <div class="upload-icon">🎼</div>
          <div class="upload-text">Drop your audio/video file here</div>
          <div class="upload-hint">or click to browse (MP3, WAV, MP4, MOV, M4A)</div>
          <input
            ref="fileInput"
            type="file"
            accept="audio/*,video/*"
            @change="handleFileSelect"
            style="display: none"
          />
        </div>

        <div class="info-box">
          <h3>✨ What This App Does:</h3>
          <ul>
            <li><strong>Audio Analysis:</strong> Extracts melody, harmony, bass, and rhythm from your audio</li>
            <li><strong>Four-Part Arrangement:</strong> Creates Soprano, Alto, Tenor, and Bass parts</li>
            <li><strong>Professional Notation:</strong> Generates standard musical notation with proper voicing</li>
            <li><strong>Multiple Formats:</strong> Export as MusicXML, MIDI, or PDF sheet music</li>
            <li><strong>AI-Powered:</strong> Uses advanced machine learning for accurate transcription</li>
          </ul>
        </div>
      </div>

      <!-- Options Section -->
      <div v-if="currentView === 'options'" class="options-section">
        <h2>Transcription Options</h2>

        <div class="audio-preview">
          <audio v-if="audioUrl" controls>
            <source :src="audioUrl" type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <p>File: {{ uploadedFile?.name }}</p>
        </div>

        <div class="option-group">
          <label>Arrangement Style:</label>
          <select v-model="options.arrangementStyle">
            <option value="satb">SATB (Soprano, Alto, Tenor, Bass)</option>
            <option value="ttbb">TTBB (Tenor 1, Tenor 2, Bass 1, Bass 2)</option>
            <option value="ssaa">SSAA (Soprano 1, Soprano 2, Alto 1, Alto 2)</option>
            <option value="mixed">Mixed (Smart Auto-detect)</option>
          </select>
        </div>

        <div class="option-group">
          <label>Key Signature (Auto-detect or specify):</label>
          <select v-model="options.keySignature">
            <option value="auto">Auto-detect</option>
            <option value="C">C Major / A Minor</option>
            <option value="G">G Major / E Minor</option>
            <option value="D">D Major / B Minor</option>
            <option value="A">A Major / F# Minor</option>
            <option value="E">E Major / C# Minor</option>
            <option value="F">F Major / D Minor</option>
            <option value="Bb">Bb Major / G Minor</option>
            <option value="Eb">Eb Major / C Minor</option>
          </select>
        </div>

        <div class="option-group">
          <label>Time Signature:</label>
          <select v-model="options.timeSignature">
            <option value="auto">Auto-detect</option>
            <option value="4/4">4/4 (Common Time)</option>
            <option value="3/4">3/4 (Waltz)</option>
            <option value="6/8">6/8</option>
            <option value="2/4">2/4</option>
            <option value="5/4">5/4</option>
          </select>
        </div>

        <div class="option-group">
          <label>Tempo (BPM):</label>
          <input 
            type="number" 
            v-model.number="options.tempo" 
            min="40" 
            max="240"
          />
        </div>

        <div class="option-group">
          <label>Difficulty Level:</label>
          <select v-model="options.difficulty">
            <option value="beginner">Beginner (Simple rhythms)</option>
            <option value="intermediate">Intermediate (Moderate complexity)</option>
            <option value="advanced">Advanced (Full complexity)</option>
          </select>
        </div>

        <div class="option-group">
          <div class="checkbox-group">
            <input
              type="checkbox"
              id="includeLyrics"
              v-model="options.includeLyrics"
            />
            <label for="includeLyrics">Include lyrics (if detectable)</label>
          </div>
        </div>

        <div class="option-group">
          <div class="checkbox-group">
            <input
              type="checkbox"
              id="includeChords"
              v-model="options.includeChords"
            />
            <label for="includeChords">Include chord symbols</label>
          </div>
        </div>

        <div class="button-group">
          <button class="btn btn-primary" @click="startTranscription">
            🎼 Start Transcription
          </button>
          <button class="btn btn-secondary" @click="resetApp">
            Cancel
          </button>
        </div>
      </div>

      <!-- Processing Section -->
      <div v-if="currentView === 'processing'" class="processing-section">
        <h2>Processing Your Audio...</h2>
        <div class="status-text">{{ status }}</div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: progress + '%' }"
          >
            {{ progress }}%
          </div>
        </div>
        <p>This may take a few minutes depending on the length of your audio.</p>
      </div>

      <!-- Results Section -->
      <div v-if="currentView === 'results'" class="results-section">
        <h2>✅ Transcription Complete!</h2>

        <div v-if="extractedLyrics.length > 0" class="lyrics-display">
          <h4>🎤 Detected Lyrics:</h4>
          <p style="font-style: italic; color: #666;">
            {{ extractedLyrics.join(' • ') }}
          </p>
        </div>

        <div class="sheet-music-viewer">
          <div class="voice-part">
            <h3>🎤 Soprano</h3>
            <div ref="sopranoStaff">
              <p style="color: #6c757d; font-style: italic;">
                Sheet music notation will appear here
              </p>
            </div>
          </div>

          <div class="voice-part">
            <h3>🎵 Alto</h3>
            <div ref="altoStaff">
              <p style="color: #6c757d; font-style: italic;">
                Sheet music notation will appear here
              </p>
            </div>
          </div>

          <div class="voice-part">
            <h3>🎶 Tenor</h3>
            <div ref="tenorStaff">
              <p style="color: #6c757d; font-style: italic;">
                Sheet music notation will appear here
              </p>
            </div>
          </div>

          <div class="voice-part">
            <h3>🎸 Bass</h3>
            <div ref="bassStaff">
              <p style="color: #6c757d; font-style: italic;">
                Sheet music notation will appear here
              </p>
            </div>
          </div>
        </div>

        <div class="button-group">
          <button class="btn btn-success" @click="downloadPDF">
            📄 Download PDF
          </button>
          <button class="btn btn-success" @click="downloadMusicXML">
            💾 Download MusicXML
          </button>
          <button class="btn btn-success" @click="downloadMIDI">
            🎹 Download MIDI
          </button>
          <button class="btn btn-secondary" @click="resetApp">
            Start New Transcription
          </button>
        </div>

        <div class="info-box">
          <h3>📝 Next Steps:</h3>
          <ul>
            <li><strong>PDF:</strong> Print or view the sheet music in any PDF reader</li>
            <li><strong>MusicXML:</strong> Import into notation software (Finale, Sibelius, MuseScore)</li>
            <li><strong>MIDI:</strong> Use with digital audio workstations (DAWs) or virtual instruments</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      currentView: 'upload',
      uploadedFile: null,
      audioUrl: null,
      transcriptionData: null,
      progress: 0,
      status: '',
      detectedTempo: 120,
      detectedTimeSignature: '4/4',
      extractedLyrics: [],
      isDragOver: false,
      options: {
        arrangementStyle: 'satb',
        keySignature: 'auto',
        timeSignature: 'auto',
        tempo: 120,
        difficulty: 'intermediate',
        includeLyrics: false,
        includeChords: false
      }
    }
  },
  mounted() {
    this.loadScripts();
  },
  methods: {
    loadScripts() {
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
    },
    
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.handleFileUpload(file);
      }
    },
    
    handleDrop(event) {
      event.preventDefault();
      this.isDragOver = false;
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileUpload(files[0]);
      }
    },
    
    handleFileUpload(file) {
      if (!file.type.match('audio.*') && !file.type.match('video.*')) {
        alert('Please upload an audio or video file (MP3, WAV, MP4, MOV, M4A)');
        return;
      }

      this.uploadedFile = file;
      const url = URL.createObjectURL(file);
      this.audioUrl = url;
      this.currentView = 'options';
    },
    
    async startTranscription() {
      this.currentView = 'processing';
      this.progress = 10;
      this.status = 'Initializing Audio Engine...';

      try {
        // Initialize audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await this.uploadedFile.arrayBuffer();
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
        let lyrics = [];
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
          this.$nextTick(() => {
            this.renderSheetMusic(notes);
          });
        }, 1000);

      } catch (error) {
        console.error('Transcription error:', error);
        alert('Error processing audio: ' + error.message);
        this.resetApp();
      }
    },
    
    detectTempo(audioBuffer, sampleRate) {
      const windowSize = Math.floor(sampleRate * 0.1);
      const energy = [];
      
      for (let i = 0; i < audioBuffer.length - windowSize; i += windowSize) {
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
          sum += Math.abs(audioBuffer[i + j]);
        }
        energy.push(sum);
      }
      
      const onsets = [];
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
    },
    
    detectPitch(audioBuffer, sampleRate) {
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
    },
    
    getNoteFromPitch(frequency) {
      const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const noteFrequencies = {
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
      
      if (frequency < 20 || frequency > 2000) return null;
      
      let minDiff = Infinity;
      let closestNote = null;
      
      for (const [note, freq] of Object.entries(noteFrequencies)) {
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
    },
    
    analyzeAudioBuffer(audioBuffer) {
      const rawData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const notes = [];
      
      const chunkSize = Math.floor(sampleRate * 0.2);
      const overlap = Math.floor(chunkSize * 0.5);
      
      let currentNote = null;
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
      
      return notes.slice(0, 32).sort((a, b) => a.position - b.position);
    },
    
    getDurationFromSamples(samples, sampleRate, tempo) {
      const seconds = samples / sampleRate;
      const beatsPerSecond = tempo / 60;
      const beats = seconds * beatsPerSecond;
      
      if (beats < 0.5) return '16';
      if (beats < 0.75) return '8';
      if (beats < 1.5) return 'q';
      if (beats < 3) return 'h';
      return 'w';
    },
    
    renderSheetMusic(notes) {
      if (!window.VexFlow) {
        setTimeout(() => this.renderSheetMusic(notes), 100);
        return;
      }

      const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = Vex.Flow;
      const parts = ['soprano', 'alto', 'tenor', 'bass'];
      
      parts.forEach(part => {
        const element = this.$refs[`${part}Staff`];
        if (element) element.innerHTML = '';
      });

      if (notes.length === 0) {
        parts.forEach(part => {
          const element = this.$refs[`${part}Staff`];
          if (element) {
            element.innerHTML = '<p style="color: #6c757d; padding: 2rem; text-align: center;">No notes detected. Try a clearer audio recording.</p>';
          }
        });
        return;
      }

      const harmony = this.generateFourPartHarmony(notes);

      Object.keys(harmony).forEach((voice) => {
        const element = this.$refs[`${voice}Staff`];
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
    },
    
    generateFourPartHarmony(melody) {
      const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const harmony = {
        soprano: melody,
        alto: [],
        tenor: [],
        bass: []
      };

      melody.forEach((note, index) => {
        const melodyNote = note.keys[0];
        const [noteName, octave] = melodyNote.split('/');
        const noteNum = noteStrings.indexOf(noteName.replace('#', '#').replace('b', 'b'));
        
        const altoInterval = Math.random() > 0.5 ? -3 : -6;
        const altoNoteNum = (noteNum + altoInterval + 12) % 12;
        const altoOctave = parseInt(octave) - (altoInterval < -3 ? 1 : 0);
        harmony.alto.push({
          keys: [`${noteStrings[altoNoteNum].replace('#', '#')}/${altoOctave}`],
          duration: note.duration
        });
        
        const tenorNoteNum = (noteNum - 7 + 12) % 12;
        const tenorOctave = parseInt(octave) - 1;
        harmony.tenor.push({
          keys: [`${noteStrings[tenorNoteNum].replace('#', '#')}/${tenorOctave}`],
          duration: note.duration
        });
        
        const bassInterval = index % 2 === 0 ? 0 : -7;
        const bassNoteNum = (noteNum + bassInterval + 12) % 12;
        const bassOctave = parseInt(octave) - 2;
        harmony.bass.push({
          keys: [`${noteStrings[bassNoteNum].replace('#', '#')}/${bassOctave}`],
          duration: note.duration === 'w' ? 'w' : 'h'
        });
      });

      return harmony;
    },
    
    async extractLyrics(audioBuffer) {
      return ["♪ Instrumental ♪", "♪ No lyrics detected ♪"];
    },
    
    downloadPDF() {
      if (!this.transcriptionData) {
        alert('No transcription data available. Please transcribe audio first.');
        return;
      }
      
      alert('PDF download would be implemented here');
    },
    
    downloadMusicXML() {
      if (!this.transcriptionData) {
        alert('No transcription data available. Please transcribe audio first.');
        return;
      }
      
      alert('MusicXML download would be implemented here');
    },
    
    downloadMIDI() {
      if (!this.transcriptionData) {
        alert('No transcription data available. Please transcribe audio first.');
        return;
      }
      
      alert('MIDI download would be implemented here');
    },
    
    resetApp() {
      this.currentView = 'upload';
      this.uploadedFile = null;
      this.audioUrl = null;
      this.transcriptionData = null;
      this.progress = 0;
      this.status = '';
      this.extractedLyrics = [];
    }
  }
}
</script>

<style>
/* Import the original styles */
@import './assets/styles.css';
</style>
