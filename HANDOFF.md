# Handoff: The "Alpha Place"

## Project Context
Welcome to **Sugar.Dom**. This is a custom-built, ultra-minimalist landing page designed for a "Greek Alpha" lifestyle movement. The user's primary goal is to convert top-of-funnel livestream (CB) traffic into a captive, high-retention audience.

The aesthetic direction is **exceptionally clean, editorial, and authoritative**. Do not use cheesy, garish, or common "Alpha Male" tropes. The design language relies on stark typography, extensive negative space, and deep "Noir" mood lighting.

## What Has Been Built So Far
- **`index.html`**: A pure text-based foundation page linking out to the various funnels.
- **`photos.html`**: A dynamic Masonry-grid portfolio for still photography, built to interlock mixed aspect ratios (`4:5`, `16:9`, `1:1`) seamlessly.
- **`cinema.html`**: A dedicated "Erotic Cinema" page utilizing a single-column stack layout so that high-end, lossless, uncropped video plays sequentially as the user scrolls.
- **`process_media.js`**: A powerful, custom Node.js pipeline utilizing `fluent-ffmpeg` and `Jimp`. When run, it transcodes raw video to lossless H.264 MP4s, drops audio, extracts frames to calculate real Hue/Sat/Luma values, calculates realistic ISO camera settings, applies color-grading tags (Noir, Crimson, etc.), and outputs to `pics_data.json`.
- **Cache & Deduplication**: The script tracks byte-sizes and SHA-256 hashes to prevent duplicates. Deleting a file from the directory and re-running the script safely prunes it from the live site.
- **Deployment**: Everything is automatically deployed via GitHub Actions (`static.yml`) to GitHub Pages (`sugardotdom.com`).

## Your Mission: Expanding the Foundation
The user has tasked us with taking the baton to continue building out the ecosystem. The next major phase is expanding the site's content and context, specifically building out the **"Alpha Place"**—likely an 'About', 'Philosophy', or 'Manifesto' section that sits alongside the visual media.

### Key Directives for the Next LLM:
1. **Maintain the Aesthetic:** Any new pages (e.g., `about.html` or `philosophy.html`) must use the same CSS variable structure (`--bg-color`, `--text-color`, `--accent-color`) and the minimalist `<style>` block found in `index.html`. Do not introduce heavy frameworks (React, Tailwind, Bootstrap). Keep it vanilla.
2. **Expand the Funnel:** Develop the copy and structure for the "About" or "Alpha Place" section. The copy should be stoic, grounded in Greek Alpha ideals (leadership, foundation, restraint), and clearly define the movement.
3. **Respect the Pipeline:** If the user wants to add more visual media to the new sections, remind them to drop the files into `pics/` or `vids/` and run `node process_media.js` to let the pipeline handle the optimization and metadata tagging.
4. **Iterate Cautiously:** Always check for user completion or input before making major design choices or rewriting the core pipeline.
