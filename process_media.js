const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Jimp = require('jimp');
const ffmpeg = require('fluent-ffmpeg');

const picsDir = path.join(__dirname, 'pics');
const vidsDir = path.join(__dirname, 'vids');
const outputJson = path.join(__dirname, 'pics_data.json');
const manifestPath = path.join(__dirname, 'process_manifest.json');

// Ensure directories exist
[picsDir, vidsDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d);
});

let manifest = {};
if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

function probeMedia(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const stream = metadata.streams.find(s => s.codec_type === 'video');
      resolve(stream);
    });
  });
}

function optimizeVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 28',
        '-an', // mute audio
        '-pix_fmt yuv420p',
        '-movflags +faststart'
      ])
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });
}

async function processMedia() {
  const galleryData = [];
  const dirs = [picsDir, vidsDir];

  for (const dir of dirs) {
    const files = fs.readdirSync(dir).filter(f => !f.startsWith('.'));

    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) continue;

      const ext = path.extname(file).toLowerCase();
      const isVideo = ['.mp4', '.mov', '.webm'].includes(ext);
      const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);

      if (!isVideo && !isImage) continue;

      const hash = getFileHash(filePath);

      // Check if already processed
      if (manifest[hash]) {
        console.log(`Skipping cached file: ${file}`);
        // Ensure the file exists where the manifest says it should be
        const finalPath = path.join(picsDir, manifest[hash].filename);
        if (fs.existsSync(finalPath)) {
          galleryData.push(manifest[hash]);
          continue;
        } else {
          console.log(`Cached file missing from disk: ${manifest[hash].filename}. Reprocessing...`);
        }
      }

      console.log(`Processing new file: ${file}`);
      try {
        let entry = {
          type: isVideo ? 'video' : 'image',
          original_filename: file,
          tags: [],
        };

        let w = 0, h = 0;
        let rAvg = 128, gAvg = 128, bAvg = 128; // default middle gray
        let outName = file;

        if (isImage) {
          const image = await Jimp.read(filePath);
          w = image.bitmap.width;
          h = image.bitmap.height;
          
          image.resize(50, 50);
          let rSum = 0, gSum = 0, bSum = 0, count = 0;
          image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            rSum += this.bitmap.data[idx + 0];
            gSum += this.bitmap.data[idx + 1];
            bSum += this.bitmap.data[idx + 2];
            count++;
          });
          rAvg = rSum / count; gAvg = gSum / count; bAvg = bSum / count;
          
          // If image is not in picsDir, copy it there
          if (dir !== picsDir) {
            outName = `${hash}${ext}`;
            fs.copyFileSync(filePath, path.join(picsDir, outName));
          }

        } else if (isVideo) {
          const stream = await probeMedia(filePath);
          if (stream) {
            w = stream.width;
            h = stream.height;
          }
          outName = `${hash}.mp4`;
          const outPath = path.join(picsDir, outName);
          console.log(`Transcoding video ${file} to ${outName}...`);
          await optimizeVideo(filePath, outPath);

          // Moody default values for video
          rAvg = 40; gAvg = 40; bAvg = 40; // Dark Noir
        }

        entry.filename = outName;
        entry.width = w;
        entry.height = h;
        entry.aspectRatio = (w && h) ? (w / h).toFixed(2) : 'unknown';

        const [hue, s, l] = rgbToHsl(rAvg, gAvg, bAvg);
        const tags = [];
        
        // Color / Luminance Logic
        if (l < 0.35) tags.push("Noir");
        else if (l > 0.7) tags.push("Ethereal");
        else tags.push("Balanced");

        if (s < 0.15) tags.push("Monochrome");
        else if (s < 0.3) tags.push("Muted");
        else if (s > 0.6) tags.push("Vivid");

        if (s >= 0.15) {
          if (hue >= 330 || hue < 30) tags.push("Crimson");
          else if (hue >= 30 && hue < 90) tags.push("Golden");
          else if (hue >= 90 && hue < 150) tags.push("Verdant");
          else if (hue >= 150 && hue < 210) tags.push("Cyan");
          else if (hue >= 210 && hue < 270) tags.push("Azure");
          else if (hue >= 270 && hue < 330) tags.push("Violet");
        }

        if (tags.includes("Noir") || tags.includes("Monochrome")) tags.push("Foundational");
        
        if (isVideo) tags.push("Motion");

        entry.tags = tags;
        entry.stats = { h: Math.round(hue), s: parseFloat(s.toFixed(2)), l: parseFloat(l.toFixed(2)) };

        // Generate Camera Settings Overlay
        const fstop = (Math.random() * (2.9 - 1.5) + 1.5).toFixed(1);
        const focalLength = Math.floor(Math.random() * (40 - 25 + 1) + 25) + 'mm';
        let isoRaw = Math.floor((1 - l) * 3200);
        let iso = Math.max(100, Math.round(isoRaw / 100) * 100);

        const locations = ['New York, New York', 'Munich, Germany', 'Berlin, Germany', 'Barcelona, Spain', 'Paris, France', 'London, UK', 'Tokyo, Japan', 'Los Angeles, California', 'Milan, Italy', 'Monaco'];
        
        entry.camera = { fstop: `f/${fstop}`, focalLength: focalLength, iso: `ISO ${iso}` };
        entry.location = locations[Math.floor(Math.random() * locations.length)];

        manifest[hash] = entry;
        galleryData.push(entry);

      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
  }

  // Write files
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(outputJson, JSON.stringify(galleryData, null, 2));
  console.log(`Saved ${galleryData.length} media items to ${outputJson}`);
}

processMedia();