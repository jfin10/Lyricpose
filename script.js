let uploadedFile = null;
let audioContext = null;
let source = null;
let analyser = null;
let animationId = null;
let renderer = null;
let context = null;
let staves = {};
let transcriptionData = null;
let detectedTempo = 120;
let detectedTimeSignature = '4/4';
let detectedKey = 'C';
let extractedLyrics = [];

// Helper: Map frequency to note name
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

function getNoteFromPitch(frequency) {
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
    
    // Only return if within reasonable tolerance (5% of frequency)
    if (minDiff / frequency < 0.05) {
        return closestNote.toLowerCase().replace('##', 'x').replace('#', '#');
    }
    return null;
}

// Auto-correlation based pitch detection
function detectPitch(audioBuffer, sampleRate) {
    const bufferSize = 4096;
    const correlations = new Array(bufferSize).fill(0);
    
    // Calculate auto-correlation
    for (let lag = 0; lag < bufferSize; lag++) {
        let correlation = 0;
        for (let i = 0; i < bufferSize - lag; i++) {
            correlation += audioBuffer[i] * audioBuffer[i + lag];
        }
        correlations[lag] = correlation;
    }
    
    // Find the peak correlation (excluding lag 0)
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
    return getNoteFromPitch(frequency);
}

// Detect tempo using onset detection
function detectTempo(audioBuffer, sampleRate) {
    const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
    const energy = [];
    
    // Calculate energy in each window
    for (let i = 0; i < audioBuffer.length - windowSize; i += windowSize) {
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
            sum += Math.abs(audioBuffer[i + j]);
        }
        energy.push(sum);
    }
    
    // Find peaks (onsets)
    const onsets = [];
    for (let i = 1; i < energy.length - 1; i++) {
        if (energy[i] > energy[i - 1] * 1.3 && energy[i] > energy[i + 1] * 1.3) {
            onsets.push(i);
        }
    }
    
    if (onsets.length < 2) return 120;
    
    // Calculate average interval between onsets
    let totalInterval = 0;
    for (let i = 1; i < onsets.length; i++) {
        totalInterval += onsets[i] - onsets[i - 1];
    }
    
    const avgInterval = totalInterval / (onsets.length - 1);
    const beatsPerSecond = (sampleRate / windowSize) / avgInterval;
    const bpm = Math.round(beatsPerSecond * 60);
    
    // Clamp to reasonable range
    return Math.max(60, Math.min(200, bpm));
}

// Detect time signature based on beat patterns
function detectTimeSignature(onsets) {
    if (onsets.length < 4) return '4/4';
    
    // Simple heuristic: look for patterns
    const intervals = [];
    for (let i = 1; i < onsets.length; i++) {
        intervals.push(onsets[i] - onsets[i - 1]);
    }
    
    // Find most common interval
    const intervalCounts = {};
    intervals.forEach(interval => {
        const key = Math.round(interval);
        intervalCounts[key] = (intervalCounts[key] || 0) + 1;
    });
    
    const mostCommon = parseInt(Object.keys(intervalCounts).reduce((a, b) => 
        intervalCounts[a] > intervalCounts[b] ? a : b
    ));
    
    // Determine time signature based on patterns
    const pattern = intervals.slice(0, 8).map(i => Math.round(i / mostCommon));
    const sum = pattern.reduce((a, b) => a + b, 0);
    
    if (sum % 3 === 0 && pattern.every(p => p === 1 || p === 2)) {
        return '3/4';
    } else if (sum % 6 === 0) {
        return '6/8';
    }
    
    return '4/4';
}

// Upload Area Functionality
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'video/mp4', 'video/quicktime'];
    if (!file.type.match('audio.*') && !file.type.match('video.*')) {
        alert('Please upload an audio or video file (MP3, WAV, MP4, MOV, M4A)');
        return;
    }

    uploadedFile = file;
    const audioURL = URL.createObjectURL(file);

    document.getElementById('audioPreview').src = audioURL;
    document.getElementById('fileName').textContent = `File: ${file.name}`;

    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('optionsSection').style.display = 'block';
}

function startTranscription() {
    document.getElementById('optionsSection').style.display = 'none';
    document.getElementById('processingSection').style.display = 'block';

    // Initialize Web Audio API
    setupAudioProcessing();
}

async function setupAudioProcessing() {
    const statusText = document.getElementById('statusText');
    const progressFill = document.getElementById('progressFill');

    statusText.textContent = "Initializing Audio Engine...";
    progressFill.style.width = "10%";
    progressFill.textContent = "10%";

    try {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        const arrayBuffer = await uploadedFile.arrayBuffer();
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        statusText.textContent = "Analyzing Audio Data...";
        progressFill.style.width = "30%";
        progressFill.textContent = "30%";

        // Detect tempo and time signature
        const rawData = audioBuffer.getChannelData(0);
        detectedTempo = detectTempo(rawData, audioBuffer.sampleRate);
        
        statusText.textContent = "Extracting Musical Notes...";
        progressFill.style.width = "50%";
        progressFill.textContent = "50%";

        // Process the audio buffer to detect pitch
        const notes = analyzeAudioBuffer(audioBuffer);

        // Extract lyrics if requested
        if (document.getElementById('includeLyrics').checked) {
            statusText.textContent = "Extracting Lyrics...";
            progressFill.style.width = "70%";
            progressFill.textContent = "70%";
            
            try {
                extractedLyrics = await extractLyrics(audioBuffer);
            } catch (e) {
                console.log("Lyrics extraction failed:", e);
                extractedLyrics = [];
            }
        }

        statusText.textContent = "Generating Sheet Music...";
        progressFill.style.width = "80%";
        progressFill.textContent = "80%";

        // Store transcription data for downloads
        transcriptionData = {
            notes: notes,
            tempo: detectedTempo,
            timeSignature: detectedTimeSignature,
            key: detectedKey,
            audioBuffer: audioBuffer,
            lyrics: extractedLyrics
        };

        setTimeout(() => {
            showResults(notes);
        }, 1000);

    } catch (e) {
        console.error(e);
        alert("Error processing audio: " + e.message);
        resetApp();
    }
}

function analyzeAudioBuffer(audioBuffer) {
    const rawData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const notes = [];
    
    // Analyze in chunks for better pitch detection
    const chunkSize = Math.floor(sampleRate * 0.2); // 200ms chunks
    const overlap = Math.floor(chunkSize * 0.5); // 50% overlap
    
    let currentNote = null;
    let noteDuration = 0;
    const minNoteDuration = chunkSize;
    
    for (let i = 0; i < rawData.length - chunkSize; i += overlap) {
        const chunk = rawData.slice(i, i + chunkSize);
        const detectedNote = detectPitch(chunk, sampleRate);
        
        if (detectedNote !== null) {
            if (currentNote === detectedNote) {
                noteDuration += overlap;
            } else {
                // Save previous note if it meets minimum duration
                if (currentNote !== null && noteDuration >= minNoteDuration) {
                    const duration = getDurationFromSamples(noteDuration, sampleRate, detectedTempo);
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
            // Note ended
            if (currentNote !== null && noteDuration >= minNoteDuration) {
                const duration = getDurationFromSamples(noteDuration, sampleRate, detectedTempo);
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
    
    // Handle last note
    if (currentNote !== null && noteDuration >= minNoteDuration) {
        const duration = getDurationFromSamples(noteDuration, sampleRate, detectedTempo);
        notes.push({ 
            keys: [currentNote], 
            duration: duration,
            position: rawData.length - noteDuration
        });
    }
    
    // Limit notes for display and sort by position
    return notes.slice(0, 32).sort((a, b) => a.position - b.position);
}

function getDurationFromSamples(samples, sampleRate, tempo) {
    const seconds = samples / sampleRate;
    const beatsPerSecond = tempo / 60;
    const beats = seconds * beatsPerSecond;
    
    if (beats < 0.5) return '16'; // Sixteenth note
    if (beats < 0.75) return '8';  // Eighth note
    if (beats < 1.5) return 'q';   // Quarter note
    if (beats < 3) return 'h';     // Half note
    return 'w'; // Whole note
}

async function extractLyrics(audioBuffer) {
    // Convert audio buffer to blob for speech recognition
    const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    const renderedBuffer = await offlineContext.startRendering();
    const blob = await audioBufferToBlob(renderedBuffer);
    
    // Use Web Speech API for lyrics extraction
    return new Promise((resolve, reject) => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            // Fallback: return placeholder lyrics
            resolve(["♪ Instrumental ♪", "♪ No lyrics detected ♪"]);
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        const lyrics = [];
        
        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    lyrics.push(result[0].transcript.trim());
                }
            }
        };
        
        recognition.onerror = (event) => {
            console.log('Speech recognition error:', event.error);
            resolve(["♪ Speech recognition failed ♪", "♪ Try clearer audio ♪"]);
        };
        
        recognition.onend = () => {
            if (lyrics.length === 0) {
                resolve(["♪ No clear lyrics detected ♪"]);
            } else {
                resolve(lyrics);
            }
        };
        
        // Create audio element for recognition
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        
        audio.play().then(() => {
            recognition.start();
        }).catch(err => {
            console.log('Audio playback failed:', err);
            resolve(["♪ Audio playback failed ♪"]);
        });
        
        // Stop recognition when audio ends
        audio.addEventListener('ended', () => {
            setTimeout(() => {
                recognition.stop();
                URL.revokeObjectURL(audioUrl);
            }, 1000);
        });
    });
}

async function audioBufferToBlob(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    
    const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
}

function showResults(notes) {
    document.getElementById('processingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';

    renderSheetMusic(notes);
}

function renderSheetMusic(notes) {
    // Clear previous
    const parts = ['soprano', 'alto', 'tenor', 'bass'];
    parts.forEach(p => document.getElementById(`${p}Staff`).innerHTML = "");

    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, TextNote } = Vex.Flow;

    if (notes.length === 0) {
        parts.forEach(part => {
            const pDiv = document.getElementById(`${part}Staff`);
            pDiv.innerHTML = `<p style="color: #6c757d; padding: 2rem; text-align: center;">No notes detected. Try a clearer audio recording.</p>`;
        });
        return;
    }

    // Generate four-part harmony
    const harmony = generateFourPartHarmony(notes);

    // Render each voice part
    Object.keys(harmony).forEach((voice, index) => {
        const div = document.getElementById(`${voice}Staff`);
        renderer = new Renderer(div, Renderer.Backends.SVG);
        renderer.resize(600, 180);
        context = renderer.getContext();

        const stave = new Stave(10, 20, 550);
        const clef = voice === 'tenor' || voice === 'bass' ? 'bass' : 'treble';
        stave.addClef(clef).addTimeSignature(detectedTimeSignature);
        stave.setContext(context).draw();

        // Create VexFlow notes for this voice
        const vexNotes = harmony[voice].map((n, i) => {
            const note = new StaveNote({ keys: n.keys, duration: n.duration });
            
            // Add lyrics to soprano part if available
            if (voice === 'soprano' && extractedLyrics && extractedLyrics.length > 0) {
                const lyricIndex = Math.floor(i * extractedLyrics.length / harmony[voice].length);
                if (extractedLyrics[lyricIndex]) {
                    note.addModifier(0, new TextNote({ text: extractedLyrics[lyricIndex].substring(0, 15), font: { family: 'Arial', size: 10 } }));
                }
            }
            
            // Add accidentals if needed
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
                div.innerHTML = `<p style="color: #6c757d; padding: 2rem; text-align: center;">Complex rhythm detected - simplified view</p>`;
            }
        } else {
            div.innerHTML = `<p style="color: #6c757d; padding: 2rem; text-align: center;">No notes for this voice</p>`;
        }
    });

    // Display detected lyrics if available
    if (extractedLyrics && extractedLyrics.length > 0) {
        const lyricsDiv = document.createElement('div');
        lyricsDiv.className = 'lyrics-display';
        lyricsDiv.innerHTML = `
            <h4>🎤 Detected Lyrics:</h4>
            <p style="font-style: italic; color: #666;">${extractedLyrics.join(' • ')}</p>
        `;
        
        const viewer = document.getElementById('sheetMusicViewer');
        viewer.insertBefore(lyricsDiv, viewer.firstChild);
    }
}

function generateFourPartHarmony(melody) {
    const harmony = {
        soprano: melody,
        alto: [],
        tenor: [],
        bass: []
    };

    // Simple harmony generation
    melody.forEach((note, index) => {
        const melodyNote = note.keys[0];
        const [noteName, octave] = melodyNote.split('/');
        const noteNum = noteStrings.indexOf(noteName.replace('#', '#').replace('b', 'b'));
        
        // Generate alto (typically a 3rd or 6th below melody)
        const altoInterval = Math.random() > 0.5 ? -3 : -6;
        const altoNoteNum = (noteNum + altoInterval + 12) % 12;
        const altoOctave = parseInt(octave) - (altoInterval < -3 ? 1 : 0);
        harmony.alto.push({
            keys: [`${noteStrings[altoNoteNum].replace('#', '#')}/${altoOctave}`],
            duration: note.duration
        });
        
        // Generate tenor (typically a 5th below melody)
        const tenorNoteNum = (noteNum - 7 + 12) % 12;
        const tenorOctave = parseInt(octave) - 1;
        harmony.tenor.push({
            keys: [`${noteStrings[tenorNoteNum].replace('#', '#')}/${tenorOctave}`],
            duration: note.duration
        });
        
        // Generate bass (root or 5th)
        const bassInterval = index % 2 === 0 ? 0 : -7;
        const bassNoteNum = (noteNum + bassInterval + 12) % 12;
        const bassOctave = parseInt(octave) - 2;
        harmony.bass.push({
            keys: [`${noteStrings[bassNoteNum].replace('#', '#')}/${bassOctave}`],
            duration: note.duration === 'w' ? 'w' : 'h' // Bass typically longer notes
        });
    });

    return harmony;
}

function resetApp() {
    if (audioContext) audioContext.close();
    uploadedFile = null;
    document.getElementById('uploadSection').style.display = 'block';
    document.getElementById('optionsSection').style.display = 'none';
    document.getElementById('processingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('progressFill').style.width = '0%';
}

// Download functions
function downloadPDF() {
    if (!transcriptionData) {
        alert('No transcription data available. Please transcribe audio first.');
        return;
    }
    
    // Generate PDF using html2canvas and jsPDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    const promises = [];
    const parts = ['soprano', 'alto', 'tenor', 'bass'];
    
    parts.forEach((part, index) => {
        const element = document.getElementById(`${part}Staff`);
        if (element.querySelector('svg')) {
            promises.push(
                html2canvas(element).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    if (index === 0) pdf.addImage(imgData, 'PNG', 10, 10, 190, 50);
                    else if (index < 3) pdf.addPage().addImage(imgData, 'PNG', 10, 10, 190, 50);
                    else pdf.addImage(imgData, 'PNG', 10, 70, 190, 50);
                })
            );
        }
    });
    
    Promise.all(promises).then(() => {
        pdf.save('sheet-music.pdf');
    }).catch(err => {
        console.error('PDF generation failed:', err);
        alert('PDF generation failed. Please try again.');
    });
}

function downloadMusicXML() {
    if (!transcriptionData) {
        alert('No transcription data available. Please transcribe audio first.');
        return;
    }
    
    const harmony = generateFourPartHarmony(transcriptionData.notes);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Soprano</part-name>
    </score-part>
    <score-part id="P2">
      <part-name>Alto</part-name>
    </score-part>
    <score-part id="P3">
      <part-name>Tenor</part-name>
    </score-part>
    <score-part id="P4">
      <part-name>Bass</part-name>
    </score-part>
  </part-list>`;
    
    Object.keys(harmony).forEach((voice, voiceIndex) => {
        const partId = `P${voiceIndex + 1}`;
        xml += `\n  <part id="${partId}">`;
        
        let measure = 1;
        xml += `\n    <measure number="${measure}">`;
        xml += `\n      <attributes>`;
        xml += `\n        <divisions>4</divisions>`;
        xml += `\n        <key><fifths>0</fifths></key>`;
        xml += `\n        <time><beats>4</beats><beat-type>4</beat-type></time>`;
        xml += `\n        <clef><sign>${voice === 'tenor' || voice === 'bass' ? 'F' : 'G'}</sign><line>${voice === 'tenor' || voice === 'bass' ? '4' : '2'}</line></clef>`;
        xml += `\n      </attributes>`;
        
        harmony[voice].forEach(note => {
            const noteName = note.keys[0].split('/')[0].toUpperCase();
            const octave = note.keys[0].split('/')[1];
            const duration = note.duration === 'w' ? '16' : note.duration === 'h' ? '8' : note.duration === 'q' ? '4' : '2';
            
            xml += `\n      <note>`;
            xml += `\n        <pitch>`;
            xml += `\n          <step>${noteName.replace('#', '').replace('B', 'B')}</step>`;
            if (noteName.includes('#')) xml += `\n          <alter>1</alter>`;
            if (noteName.includes('B')) xml += `\n          <alter>-1</alter>`;
            xml += `\n          <octave>${octave}</octave>`;
            xml += `\n        </pitch>`;
            xml += `\n        <duration>${duration}</duration>`;
            xml += `\n        <type>${note.duration}</type>`;
            xml += `\n      </note>`;
        });
        
        xml += `\n    </measure>`;
        xml += `\n  </part>`;
    });
    
    xml += '\n</score-partwise>';
    
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sheet-music.musicxml';
    a.click();
    URL.revokeObjectURL(url);
}

function downloadMIDI() {
    if (!transcriptionData) {
        alert('No transcription data available. Please transcribe audio first.');
        return;
    }
    
    // Create a simple MIDI file using basic MIDI format
    const midiData = createMIDIFile(transcriptionData.notes, detectedTempo);
    
    const blob = new Blob([midiData], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sheet-music.mid';
    a.click();
    URL.revokeObjectURL(url);
}

function createMIDIFile(notes, tempo) {
    // MIDI file header
    const header = 'MThd\x00\x00\x00\x06\x00\x00\x00\x01\x00\x60'; // Format 0, 1 track, 96 ticks per quarter note
    
    // Convert tempo to microseconds per quarter note
    const microsecondsPerQuarter = Math.round(60000000 / tempo);
    
    // Track header
    let track = 'MTrk';
    
    // Track events will be added here
    const events = [];
    
    // Set tempo
    events.push(0x00, 0xFF, 0x51, 0x03, 
        (microsecondsPerQuarter >> 16) & 0xFF,
        (microsecondsPerQuarter >> 8) & 0xFF,
        microsecondsPerQuarter & 0xFF);
    
    // Add notes
    let currentTime = 0;
    notes.forEach(note => {
        const noteName = note.keys[0];
        const [noteStr, octave] = noteName.split('/');
        const noteNum = noteStrings.indexOf(noteStr.replace('#', '#').replace('b', 'b'));
        const midiNote = (parseInt(octave) + 1) * 12 + noteNum;
        
        const duration = note.duration === 'w' ? 96 : note.duration === 'h' ? 48 : note.duration === 'q' ? 24 : 12;
        
        // Note on
        const deltaTimeOn = currentTime > 0 ? currentTime : 0;
        events.push(...writeVariableLength(deltaTimeOn), 0x90, midiNote, 0x64); // Note on with velocity 100
        
        // Note off
        events.push(...writeVariableLength(duration), 0x80, midiNote, 0x40); // Note off with velocity 64
        
        currentTime = 0; // Reset for next note
    });
    
    // End of track
    events.push(0x00, 0xFF, 0x2F, 0x00);
    
    // Calculate track length
    const trackLength = events.length;
    track += String.fromCharCode(
        (trackLength >> 24) & 0xFF,
        (trackLength >> 16) & 0xFF,
        (trackLength >> 8) & 0xFF,
        trackLength & 0xFF
    );
    
    // Convert events to bytes
    for (const event of events) {
        track += String.fromCharCode(event);
    }
    
    return header + track;
}

function writeVariableLength(value) {
    const bytes = [];
    let buffer = value & 0x7F;
    
    while ((value >>= 7) > 0) {
        buffer <<= 8;
        buffer |= ((value & 0x7F) | 0x80);
        bytes.unshift(buffer & 0xFF);
        buffer = value & 0x7F;
    }
    
    bytes.unshift(buffer);
    return bytes;
}
