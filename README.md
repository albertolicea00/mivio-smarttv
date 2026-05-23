# 🍿 Mivio for Smart TV (Tizen & webOS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Platform Compatibility](https://img.shields.io/badge/Platforms-Tizen%20%7C%20webOS-brightgreen.svg?style=flat-square)](#platform-specific-goals)

**Mivio** is a premium, high-performance media management and playback application tailored for modern Smart TVs (Samsung Tizen and LG webOS). Designed for large-screen cinematic experiences, Mivio leverages web technologies optimized for TV hardware to deliver an elegant, fast, and responsive media cataloging and streaming experience.

Whether scanning local network shares via **SMB** or streaming over a secure cloud-based **WebDAV** server, Mivio handles metadata collection, naming parsing, watch progress tracking, and media playback seamlessly using HTML5 video and MSE/EME.

---

## 🎨 Platform-Specific Experience Goals

Mivio Smart TV is explicitly designed for the "10-foot UI" paradigm, where the user interacts via a simple D-pad remote:

- **Samsung Tizen & LG webOS**: High-contrast poster grids, large typography, spatial navigation (D-pad), parallax hover states on focused cards, and deep integration with native TV media player APIs for hardware-accelerated video decoding.
- **Cinematic Feel**: Immersive backdrops, fluid focus transitions, and minimal distractions.

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
