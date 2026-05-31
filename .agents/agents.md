# Mivio Smart TV Agents Configuration

## Project Overview
Mivio for Smart TV (Tizen & webOS) is a premium, high-performance media management and playback application tailored for modern Smart TVs (Samsung Tizen and LG webOS). Designed for large-screen cinematic experiences, Mivio leverages web technologies optimized for TV hardware to deliver an elegant, fast, and responsive media cataloging and streaming experience.

## Key Technologies
- Web Technologies: HTML5, CSS3, JavaScript/TypeScript
- Media Playback: HTML5 video with MSE/EME (Media Source Extensions / Encrypted Media Extensions)
- Framework: Likely using a web framework (React/Vue/Svelte) or vanilla JS
- Build System: npm
- Platform SDKs: Samsung Tizen Studio, LG webOS TV SDK

## Project Structure
```
mivio-smarttv/
├── public/                 # Static assets
├── src/                    # Source code
├── shared/                 # Shared code between Tizen and webOS
├── tizen/                  # Tizen-specific files
├── webos/                  # webOS-specific files
├── CONTRIBUTING.md         # Contribution guidelines
├── LICENSE                 # License file
├── README.md               # Project documentation
└── SECURITY.md             # Security policy
```

## Development Guidelines
- Target branch for PRs: `beta` (main is production-ready)
- Prerequisites: Node.js (v18+), Samsung Tizen Studio (for Tizen deployment), LG webOS TV SDK (for webOS deployment)
- Setup process:
  1. Clone repository
  2. Run `npm install` to install dependencies
  3. Run `npm run dev` to start development server for browser testing
  4. For TV deployment:
     - For Tizen: `npm run build:tizen`
     - For webOS: `npm run build:webos`

## Platform Features & Limitations
- ✅ USB Read-Only: Can play local files from USB drives, but metadata writing is not supported
- ✅ Home Server Client: Stream directly from home servers (Plex, Jellyfin) consuming metadata from server
- ✅ Native TV Player: Hardware-accelerated video decoding using native Tizen/webOS media APIs
- ❌ No Local Multi-Account: Profiles and watch states managed entirely by home server

## Agent Instructions
When working on this project:
1. Understand the web technology stack used for TV optimization
2. Work primarily in the src/ directory for general code, or platform-specific directories (tizen/, webos/) for platform-specific changes
3. Ensure compatibility with TV hardware constraints and "10-foot UI" paradigm
4. Focus on home server client functionality (Plex, Jellyfin, Emby integration)
5. Optimize for TV performance limitations (memory, CPU, GPU)
6. Test thoroughly on actual TV devices or emulators
7. Follow existing code patterns and conventions
8. Keep security in mind when handling network operations and data parsing
9. Update documentation when changing public APIs or significant functionality