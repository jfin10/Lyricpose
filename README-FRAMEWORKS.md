# 🎵 Audio to Sheet Music Transcriber - Multi-Framework Versions

A comprehensive audio-to-sheet music transcription application implemented in multiple modern web frameworks. This project demonstrates the same functionality across different technology stacks.

## 🚀 Available Versions

### 1. **Vanilla JavaScript** (Original)
- **Location**: `./` (root directory)
- **Technologies**: HTML5, CSS3, JavaScript ES6+
- **Features**: Pure JavaScript implementation with VexFlow integration
- **Run**: `python -m http.server 8000` or any static server

### 2. **React Version**
- **Location**: `./react-version/`
- **Technologies**: React 18, Hooks, VexFlow, Tone.js
- **Features**: Component-based architecture, state management with hooks
- **Setup**: 
  ```bash
  cd react-version
  npm install
  npm start
  ```

### 3. **Vue.js Version**
- **Location**: `./vue-version/`
- **Technologies**: Vue 3, Composition API, VexFlow
- **Features**: Reactive data binding, component lifecycle management
- **Setup**:
  ```bash
  cd vue-version
  npm install
  npm run serve
  ```

### 4. **Angular Version**
- **Location**: `./angular-version/`
- **Technologies**: Angular 15, TypeScript, RxJS
- **Features**: Strong typing, dependency injection, Angular forms
- **Setup**: 
  ```bash
  cd angular-version
  npm install  # Required to install Angular dependencies
  ng serve
  ```
- **Note**: Requires `npm install` before first run to install Angular packages

### 5. **Svelte Version**
- **Location**: `./svelte-version/`
- **Technologies**: Svelte 3, SvelteKit, Vite
- **Features**: Compile-time optimizations, reactive statements
- **Setup**:
  ```bash
  cd svelte-version
  npm install
  npm run dev
  ```

### 6. **Next.js Version**
- **Location**: `./nextjs-version/`
- **Technologies**: Next.js 13, React, CSS-in-JS
- **Features**: Server-side rendering, optimized performance
- **Setup**:
  ```bash
  cd nextjs-version
  npm install
  npm run dev
  ```

## 🎯 Core Features (All Versions)

### Audio Processing
- **Real Pitch Detection**: Auto-correlation based frequency analysis
- **Tempo Detection**: Energy-based BPM detection (60-200 BPM)
- **Time Signature Analysis**: Pattern recognition for common meters
- **Note Duration Calculation**: Sample-to-musical-duration conversion

### Music Generation
- **Four-Part Harmony**: SATB arrangement generation
- **Professional Notation**: VexFlow integration for sheet music
- **Accidental Support**: Sharp and flat note handling
- **Multiple Clefs**: Treble and bass clef rendering

### Export Options
- **PDF Generation**: jsPDF + html2canvas integration
- **MusicXML Export**: Standard notation software format
- **MIDI File Creation**: Basic MIDI file generation
- **Lyrics Extraction**: Web Speech API integration

### User Interface
- **Drag & Drop Upload**: File handling for audio/video formats
- **Real-time Progress**: Processing status and progress indicators
- **Responsive Design**: Mobile-friendly layouts
- **Professional Styling**: Modern gradient backgrounds and animations

## 🛠️ Technical Implementation

### Audio Analysis Algorithm
```javascript
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
  
  // Find peak correlation for fundamental frequency
  // Convert frequency to musical note
}
```

### Harmony Generation
- **Music Theory Principles**: Proper voice leading and chord progressions
- **Interval Calculations**: Thirds, sixths, and fifths for harmony
- **Octave Management**: Proper voice ranges for SATB parts

### File Format Support
- **Input**: MP3, WAV, MP4, MOV, M4A
- **Output**: PDF, MusicXML, MIDI
- **Processing**: Web Audio API for audio buffer manipulation

## 📊 Framework Comparison

| Feature | React | Vue | Angular | Svelte | Next.js |
|---------|-------|-----|---------|--------|---------|
| Bundle Size | Medium | Small | Large | Very Small | Medium |
| Learning Curve | Medium | Easy | Hard | Easy | Medium |
| Performance | Good | Good | Excellent | Excellent | Excellent |
| TypeScript | Optional | Optional | Built-in | Optional | Supported |
| SSR | Manual | Manual | Built-in | Manual | Built-in |
| Community | Large | Large | Large | Growing | Large |

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach
- Touch-friendly controls
- Adaptive layouts for all screen sizes

### Accessibility
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility

### Visual Design
- Modern gradient backgrounds
- Smooth animations and transitions
- Professional color scheme
- Intuitive iconography

## 🔧 Development Setup

### Prerequisites
- Node.js 16+ (for framework versions)
- Python 3+ (for vanilla JS version)
- Modern web browser with Web Audio API support

### Common Dependencies
- **VexFlow**: Music notation rendering
- **Tone.js**: Audio processing framework
- **jsPDF**: PDF generation
- **html2canvas**: Canvas to image conversion

### Development Commands
```bash
# Vanilla JS
python -m http.server 8000

# React
npm install && npm start

# Vue
npm install && npm run serve

# Angular
npm install && ng serve

# Svelte
npm install && npm run dev

# Next.js
npm install && npm run dev
```

## 🎵 Supported Audio Formats

### Input Formats
- **Audio**: MP3, WAV, M4A, AAC, OGG
- **Video**: MP4, MOV, AVI (audio extraction)

### Processing Capabilities
- Sample rates: 8kHz - 96kHz
- Bit depths: 16-bit, 24-bit, 32-bit
- Channels: Mono, Stereo
- Duration: Up to 10 minutes recommended

## 📱 Browser Compatibility

### Supported Browsers
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ⚠️ Mobile browsers (limited performance)

### Required APIs
- Web Audio API
- File API
- Canvas API
- Blob API

## 🚀 Performance Considerations

### Optimization Techniques
- Chunk-based audio processing
- Web Workers for heavy computations
- Lazy loading of external libraries
- Efficient memory management

### Limitations
- Processing time scales with audio length
- Large files may cause memory issues
- Real-time processing not optimized
- Mobile performance varies

## 🔮 Future Enhancements

### Planned Features
- [ ] Real-time transcription
- [ ] Advanced harmony analysis
- [ ] Chord detection
- [ ] Multiple instrument support
- [ ] Cloud processing option
- [ ] API integration

### Technical Improvements
- [ ] WebAssembly optimization
- [ ] Machine learning models
- [ ] Enhanced audio preprocessing
- [ ] Better noise reduction
- [ ] Improved accuracy

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for any framework-specific improvements.

### Development Guidelines
- Follow framework-specific best practices
- Maintain consistent UI/UX across versions
- Include proper error handling
- Add comprehensive documentation
- Test across multiple browsers

---

**Choose your preferred framework and start transcribing audio to sheet music today! 🎼**
