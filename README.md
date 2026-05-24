# 🍿 Mivio for Smart TV (Tizen & webOS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Platform Compatibility](https://img.shields.io/badge/Platforms-Tizen%20%7C%20webOS-brightgreen.svg?style=flat-square)](#platform-specific-goals)

**Mivio** is a premium, high-performance media management and playback application tailored for modern Smart TVs (Samsung Tizen and LG webOS). Designed for large-screen cinematic experiences, Mivio leverages web technologies optimized for TV hardware to deliver an elegant, fast, and responsive media cataloging and streaming experience.

Whether scanning local network shares via **SMB** or streaming over a secure cloud-based **WebDAV** server, Mivio handles metadata collection, naming parsing, watch progress tracking, and media playback seamlessly using HTML5 video and MSE/EME.

---

## 🎨 Platform Features & Limitations

Mivio Smart TV is explicitly designed for the "10-foot UI" paradigm, tailored specifically to the capabilities of Samsung Tizen and LG webOS:

- ✅ **USB Read-Only**: You can play local files from USB drives, but metadata writing is not supported on these platforms.
- ✅ **Home Server Client**: Stream directly from your home servers (Plex, Jellyfin) consuming metadata directly from the server.
- ✅ **Native TV Player**: Seamless, hardware-accelerated video decoding using the native Tizen/webOS media APIs.
- ❌ **No Local Multi-Account**: Profiles and watch states are managed entirely by your home server.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Samsung Tizen Studio (for Tizen deployment)
- LG webOS TV SDK (for webOS deployment)

### Setup and Running the Project
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/albertolicea00/mivio-smarttv.git
   cd mivio-smarttv
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run Development Server (Browser Testing):**
   ```bash
   npm run dev
   ```

4. **Build and Package for TV:**
   - For Tizen: `npm run build:tizen`
   - For webOS: `npm run build:webos`

---

## 🤝 Contribution Guidelines

We use a structured branch strategy to protect stable builds while supporting active feature implementation:
- **`main`**: Production-ready release branch.
- **`beta`**: Standard development target. **Always target your PRs to `beta`!**

For detailed instructions on commit formats, coding style guidelines, and PR checks, please review [CONTRIBUTING.md](CONTRIBUTING.md).

For vulnerability reporting or security-related matters, see [SECURITY.md](SECURITY.md).

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
