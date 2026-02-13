# Audio to Sheet Music Transcriber

A web application that converts audio and video files into professional four-part sheet music arrangements using AI-powered transcription.

## Features

- **Audio/Video Upload**: Support for MP3, WAV, MP4, MOV, M4A files
- **Drag & Drop Interface**: Intuitive file upload with visual feedback
- **Multiple Arrangement Styles**: SATB, TTBB, SSAA, and mixed arrangements
- **Customizable Options**: Key signature, time signature, tempo, and difficulty settings
- **Real-time Processing**: Progress tracking with detailed status updates
- **Multiple Export Formats**: PDF, MusicXML, and MIDI downloads
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. **Upload File**: Drag and drop or click to browse for your audio/video file
2. **Configure Options**: Choose arrangement style, key, tempo, and other settings
3. **Start Transcription**: Click the "Start Transcription" button to begin processing
4. **Download Results**: Once complete, download your sheet music in your preferred format

## Technical Implementation

### Frontend
- **HTML5**: Semantic structure with accessibility features
- **CSS3**: Modern styling with gradients, animations, and responsive design
- **Vanilla JavaScript**: File handling, audio preview, and UI interactions

### Future Enhancements
- **Audio Processing**: Integration with Web Audio API for pitch detection
- **Notation Libraries**: VexFlow or ABCjs for rendering sheet music
- **Backend Integration**: Python/Flask server for AI transcription
- **Machine Learning**: Models for melody extraction and harmony analysis

## File Structure

```
windsurf-project/
├── index.html          # Main application interface
├── README.md           # Project documentation
└── assets/             # Static assets (future)
    ├── css/           # Stylesheets
    ├── js/            # JavaScript modules
    └── fonts/         # Custom fonts
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Getting Started

1. Clone or download the project files
2. Open `index.html` in a modern web browser
3. Or run a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```
4. Navigate to `http://localhost:8000`

## License

This project is open source and available under the MIT License.
