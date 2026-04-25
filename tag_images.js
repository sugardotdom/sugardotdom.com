const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const picsDir = path.join(__dirname, 'pics');
const outputJson = path.join(__dirname, 'pics_data.json');

// Convert RGB to HSL to help with tagging
function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
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

async function processImages() {
  const files = fs.readdirSync(picsDir).filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpeg'));
  const imageData = [];

  console.log(`Found ${files.length} images to process...`);

  for (const file of files) {
    const filePath = path.join(picsDir, file);
    try {
      const image = await Jimp.read(filePath);
      
      // Calculate average color by resizing to 1x1 or scanning pixels (scanning is more accurate but slower, let's scan a resized 50x50 version)
      image.resize(50, 50);
      let rSum = 0, gSum = 0, bSum = 0;
      let count = 0;
      
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        rSum += this.bitmap.data[idx + 0];
        gSum += this.bitmap.data[idx + 1];
        bSum += this.bitmap.data[idx + 2];
        count++;
      });
      
      const rAvg = rSum / count;
      const gAvg = gSum / count;
      const bAvg = bSum / count;
      
      const [h, s, l] = rgbToHsl(rAvg, gAvg, bAvg);
      
      const tags = [];
      
      // Luminance tags
      if (l < 0.35) tags.push("Noir");
      else if (l > 0.7) tags.push("Ethereal");
      else tags.push("Balanced");

      // Saturation tags
      if (s < 0.15) {
        tags.push("Monochrome");
      } else if (s < 0.3) {
        tags.push("Muted");
      } else if (s > 0.6) {
        tags.push("Vivid");
      }
      
      // Hue tags (only if saturated enough)
      if (s >= 0.15) {
        if (h >= 330 || h < 30) tags.push("Crimson"); // Redish
        else if (h >= 30 && h < 90) tags.push("Golden"); // Yellow/Orange
        else if (h >= 90 && h < 150) tags.push("Verdant"); // Green
        else if (h >= 150 && h < 210) tags.push("Cyan");
        else if (h >= 210 && h < 270) tags.push("Azure"); // Blue
        else if (h >= 270 && h < 330) tags.push("Violet"); // Purple
      }

      // Add a general category "Alpha" to align with user's aesthetic goal
      // if it fits a certain vibe, maybe Noir or Crimson
      if (tags.includes("Noir") || tags.includes("Monochrome")) {
        tags.push("Foundational");
      }

      // Generate estimated camera settings
      const fstop = (Math.random() * (2.9 - 1.5) + 1.5).toFixed(1);
      const focalLength = Math.floor(Math.random() * (40 - 25 + 1) + 25) + 'mm';
      
      // ISO determined by overall luma (lower luma = higher ISO)
      // Luma ranges from 0 to 1. If luma is 0.1, iso is around 3200. If luma is 0.9, iso is around 100.
      let isoRaw = Math.floor((1 - l) * 3200);
      // Round to nearest 100 for a realistic ISO look
      let iso = Math.max(100, Math.round(isoRaw / 100) * 100);

      // Random Location
      const locations = [
        'New York, New York',
        'Munich, Germany',
        'Berlin, Germany',
        'Barcelona, Spain',
        'Paris, France',
        'London, UK',
        'Tokyo, Japan',
        'Los Angeles, California',
        'Milan, Italy',
        'Monaco'
      ];
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];

      imageData.push({
        filename: file,
        tags: tags,
        stats: { h: Math.round(h), s: parseFloat(s.toFixed(2)), l: parseFloat(l.toFixed(2)) },
        camera: {
          fstop: `f/${fstop}`,
          focalLength: focalLength,
          iso: `ISO ${iso}`
        },
        location: randomLocation
      });
      
      console.log(`Processed ${file}: ${tags.join(', ')}`);
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }

  fs.writeFileSync(outputJson, JSON.stringify(imageData, null, 2));
  console.log(`Saved tags to ${outputJson}`);
}

processImages();