# Sugar.Dom Architecture

This document details the custom infrastructure driving the `sugardotdom.com` web presence. The platform is designed to be an exceptionally clean, high-end "Alpha/Greek" editorial site with zero reliance on bulky frameworks or bloated content management systems.

## 1. Core Technology Stack
- **Frontend:** Pure, minimalist HTML5, CSS3 (CSS Grid/Flexbox), and vanilla JavaScript.
- **Backend/Processing:** Node.js media processing pipeline (`fluent-ffmpeg`, `Jimp`).
- **Deployment:** GitHub Pages + GitHub Actions Workflow (`.github/workflows/static.yml`).
- **Data Storage:** Flat-file JSON database (`pics_data.json`).

## 2. The Media Pipeline (`process_media.js`)
The beating heart of the repository is the custom Node.js script. When new files are dropped into the `pics/` or `vids/` folders, running `node process_media.js` executes the following sequence:

### A. Deduplication & Caching
1. Checks the exact byte-size of every file to skip true duplicates (even if filenames differ).
2. Calculates a SHA-256 hash of the file to determine if it has already been processed (tracked in `process_manifest.json`).
3. If a file is deleted from the directories, the script automatically prunes it from the database so there are no broken links on the frontend.

### B. Video Transcoding
If raw `.mp4` or `.mov` files are detected:
- The script uses `ffmpeg` to transcode them into highly optimized H.264 `.mp4` format.
- Encoding settings prioritize quality: `-preset slow` and `-crf 18` (visually lossless).
- The `-an` flag strips all audio to reduce file size and enforce an editorial "moving portrait" aesthetic.
- The `+faststart` flag is applied for instant web streaming.

### C. Color & Metadata Analysis
1. **For Images:** `Jimp` shrinks the image and analyzes average pixel values to find the true Hue, Saturation, and Luma.
2. **For Video:** `ffmpeg` jumps to the 20% mark, snaps a temporary screenshot, runs the same `Jimp` pixel analysis, and deletes the screenshot.
3. Based on the calculated HSL values, media is dynamically assigned editorial tags: `Noir`, `Monochrome`, `Vivid`, `Crimson`, `Foundational`, etc.
4. **Cinematic ISO Logic:** The script simulates accurate camera settings (Aperture, Focal Length, ISO). The ISO is directly tied to the file's Luma value (darker scenes get ISO 100-500; lighter scenes get ISO 500-1600).
5. A random high-end global location is appended to the metadata.

## 3. Frontend Architecture

### `index.html` (The Foundation)
A strictly text-based, minimalist landing page prioritizing high typography and ample negative space to convert livestream traffic to captive audiences.

### `photos.html` (Photography Gallery)
- Dynamically loads `pics_data.json` with a cache-busting timestamp.
- Filters out videos.
- Employs a complex **Masonry Grid** layout. Utilizing CSS `grid-auto-flow: dense;`, JS calculates the exact aspect ratio of each photo and assigns structural classes (`.ar-portrait`, `.ar-landscape`, etc.) to build an interlocking, non-cropping portfolio wall.
- **Anti-Piracy Measures:** Strict implementation of `draggable="false"`, `pointer-events: none`, and disabled right-click context menus.
- Intersection Observers trigger hover states (scaling and typography overlays) automatically as the user scrolls on mobile devices.

### `cinema.html` (Erotic Cinema Segment)
- Similar foundational logic as the photography gallery, but filters strictly for video files.
- Replaces the masonry grid with a **Single Column Stack** layout.
- Media elements scale with `object-fit: contain`, allowing uncropped, cinematic widescreen presentations with significant negative space (`4rem` gap) to simulate a high-end screening room.