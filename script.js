let uploadedFile = null;
let audioContext = null;
let source = null;
let analyser = null;
let animationId = null;
let renderer = null;
let context = null;
let staves = {};

// Helper: Map frequency to note name
const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function getNoteFromPitch(frequency) {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const midi = Math.round(noteNum) + 69;
    const noteIndex = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    return noteStrings[noteIndex] + "/" + octave;
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
        progressFill.style.width = "40%";
        progressFill.textContent = "40%";

        // Process the audio buffer to detect pitch
        const notes = analyzeAudioBuffer(audioBuffer);

        statusText.textContent = "Generating Notation...";
        progressFill.style.width = "80%";
        progressFill.textContent = "80%";

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
    // Simplified offline analysis - normally requires complex FFT/Autocorrelation
    // For this demo, we'll extract "peaks" in amplitude to simulate note onsets
    // and map them to a random key for demonstration of rendering.

    // In a real app, you would usage pitch detection (e.g. YIN algorithm) here.
    const rawData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const notes = [];

    // Simulate detecting notes every ~0.5 seconds for demo
    const step = Math.floor(sampleRate * 0.5);

    for (let i = 0; i < rawData.length; i += step) {
        // Mock logic: generate a note in C Major scale
        const possibleNotes = ['c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4', 'c/5'];
        const note = possibleNotes[Math.floor(Math.random() * possibleNotes.length)];
        const duration = ['q', 'h', '8'][Math.floor(Math.random() * 3)];

        notes.push({ keys: [note], duration: duration });

        if (notes.length > 16) break; // Limit to 4 bars for demo
    }

    return notes;
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

    const { Renderer, Stave, StaveNote, Voice, Formatter } = Vex.Flow;

    // Render Soprano (Melody) for demo
    const div = document.getElementById('sopranoStaff');
    renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(600, 150);
    context = renderer.getContext();

    const stave = new Stave(10, 20, 550);
    stave.addClef("treble").addTimeSignature("4/4");
    stave.setContext(context).draw();

    // Create VexFlow notes
    const vexNotes = notes.map(n => new StaveNote({ keys: n.keys, duration: n.duration }));

    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    // Ensure we have enough notes to fill voice, or truncate to demonstration
    // Note: handling strict timing in VexFlow is complex; this is a simplified view
    try {
        // Just take first 4 notes to avoid timing complexity in demo
        const demoNotes = [
            new StaveNote({ keys: ["c/4"], duration: "q" }),
            new StaveNote({ keys: ["d/4"], duration: "q" }),
            new StaveNote({ keys: ["e/4"], duration: "q" }),
            new StaveNote({ keys: ["f/4"], duration: "q" })
        ];

        voice.addTickables(demoNotes);
        new Formatter().joinVoices([voice]).format([voice], 500);
        voice.draw(context, stave);
    } catch (e) {
        console.log("Formatting error in demo", e);
    }

    // Render placeholders for other parts
    ['alto', 'tenor', 'bass'].forEach(part => {
        const pDiv = document.getElementById(`${part}Staff`);
        pDiv.innerHTML = `<p style="color: #6c757d; padding: 2rem; text-align: center;">(Harmony generation inactive in demo mode)</p>`;
    });
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

// Placeholder functions for download
function downloadPDF() { alert('PDF download feature coming soon!'); }
function downloadMusicXML() { alert('MusicXML download feature coming soon!'); }
function downloadMIDI() { alert('MIDI download feature coming soon!'); }
