# 🎵 Audio to Sheet Music Transcriber

An intelligent web application that listens to your audio or video files and automatically generates professional four-part sheet music (SATB). Whether you're a composer, choir director, or music student, this tool simplifies the process of transcribing complex arrangements.

## ✨ Features

-   **Multi-Format Support**: Upload MP3, WAV, MP4, MOV, or M4A files.
-   **Intelligent Analysis**: (In Progress) Detects melody, harmony, bass lines, and rhythm.
-   **Smart Arrangement**: Automatically arranges music into Soprano, Alto, Tenor, and Bass (SATB) parts.
-   **Customizable Options**:
    -   Select arrangement styles (SATB, TTBB, SSAA).
    -   Auto-detect or manually specify Key and Time Signatures.
    -   Adjust target difficulty levels.
-   **Export Capabilities**:
    -   📄 PDF Sheet Music
    -   💾 MusicXML (for Finale, Sibelius, MuseScore)
    -   🎹 MIDI files for DAWs

## 🚀 How to Run Locally

You can run this project directly on your machine without any complex installation.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/jfin10/Lyricpose.git
    cd Lyricpose
    ```

2.  **Open the application**:
    -   Simply locate `index.html` in the project folder and double-click it to open in your web browser.
    -   *Alternatively*, if you use VS Code, you can use the "Live Server" extension to run it.

## 🛠️ Technologies Used

-   **HTML5 & CSS3**: For a responsive, modern, and accessible user interface.
-   **JavaScript (ES6+)**: Handles the application logic and user interactions.
-   **Future Integration**:
    -   *Web Audio API* for client-side audio processing.
    -   *Machine Learning* models (e.g., TensorFlow.js or a Python backend) for pitch detection/transcription.
    -   *VexFlow* or *ABCjs* for rendering sheet music notation in the browser.

## 📝 Usage

1.  **Upload**: Drag and drop your audio file into the designated area.
2.  **Configure**: Choose your desired key, time signature, and arrangement style.
3.  **Transcribe**: Click "Start Transcription" and watch the progress.
4.  **Review & Export**: View the generated sheet music parts and download them in your preferred format.

## 🗺️ Roadmap

-   [ ] **Real-world Audio Processing Engine**: Replace the simulation with actual FFT (Fast Fourier Transform) analysis.
-   [ ] **Pitch Detection Algorithm**: Implement algorithms like YIN or autocorrelation to detect notes.
-   [ ] **Sheet Music Rendering**: Integrate VexFlow to draw real dynamic music staves.
-   [ ] **Backend Integration**: Set up a Python (Flask/Django) server to handle heavy ML processing if client-side is insufficient.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
