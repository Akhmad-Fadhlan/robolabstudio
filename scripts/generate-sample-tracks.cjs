/**
 * Generates 3 valid vector PDF track files in public/tracks/ for RoboLab Studio Robot Simulator:
 * 1. track-basic-oval.pdf       - Basic oval track with START and FINISH zones
 * 2. track-perempatan-maze.pdf  - Grid intersections (+, T, 90-deg turns) for Plan & Index practice
 * 3. track-lomba-pro.pdf        - Competition track with curves, intersections, chicane & dual-color zone
 */
const fs = require('fs');
const path = require('path');

function buildSimplePdf(pageWidth, pageHeight, contentStream) {
  const objects = [];
  const addObj = (body) => {
    objects.push(body);
    return objects.length;
  };

  // 1: Catalog
  addObj('<< /Type /Catalog /Pages 2 0 R >>');
  // 2: Pages
  addObj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  // 3: Page
  addObj(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`
  );
  // 4: Content stream
  const streamBytes = Buffer.from(contentStream, 'utf8');
  addObj(`<< /Length ${streamBytes.length} >>\nstream\n${contentStream}\nendstream`);
  // 5: Helvetica Bold Font
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

const W = 1200;
const H = 800;

// 1. Track Basic Oval
const streamOval = [
  // White arena background
  '1 1 1 rg',
  `0 0 ${W} ${H} re f`,
  // Subtle grid lines
  '0.91 0.94 0.97 RG 1 w',
  ...Array.from({ length: 11 }, (_, i) => `0 ${(i + 1) * 66} m ${W} ${(i + 1) * 66} l S`),
  ...Array.from({ length: 17 }, (_, i) => `${(i + 1) * 66} 0 m ${(i + 1) * 66} ${H} l S`),
  // Start Box (Light Purple)
  '0.85 0.80 0.98 rg',
  '160 110 90 90 re f',
  // Finish Circle / Box (Light Emerald)
  '0.72 0.95 0.85 rg',
  '940 580 90 90 re f',
  // Main Black Line Track (18pt width)
  '0.05 0.05 0.08 RG 18 w 1 J 1 j',
  '205 155 m',
  '205 620 l',
  '580 620 l',
  '580 390 l',
  '985 390 l',
  '985 625 l',
  'S',
  // Cross marker at first corner
  '140 420 m 270 420 l S',
  '510 500 m 650 500 l S',
  // Labels
  'BT /F1 18 Tf 0.35 0.25 0.65 rg 175 85 Td (START) Tj ET',
  'BT /F1 18 Tf 0.06 0.55 0.38 rg 955 680 Td (FINISH) Tj ET',
  'BT /F1 20 Tf 0.15 0.20 0.30 rg 40 755 Td (ROBOLAB STUDIO - TRACK 1: BASIC LINE FOLLOWER & CHECKPOINT) Tj ET',
].join('\n');

// 2. Track Perempatan & Maze
const streamMaze = [
  '1 1 1 rg',
  `0 0 ${W} ${H} re f`,
  '0.91 0.94 0.97 RG 1 w',
  ...Array.from({ length: 11 }, (_, i) => `0 ${(i + 1) * 66} m ${W} ${(i + 1) * 66} l S`),
  ...Array.from({ length: 17 }, (_, i) => `${(i + 1) * 66} 0 m ${(i + 1) * 66} ${H} l S`),
  // Start Box
  '0.85 0.80 0.98 rg 110 90 90 90 re f',
  // Finish Box
  '0.72 0.95 0.85 rg 990 600 90 90 re f',
  // Black Line Grid Maze (18pt width)
  '0.05 0.05 0.08 RG 18 w 1 J 1 j',
  // Vertical columns
  '155 135 m 155 645 l S',
  '420 135 m 420 645 l S',
  '720 135 m 720 645 l S',
  '1035 135 m 1035 645 l S',
  // Horizontal rows creating + and T intersections
  '95 280 m 1095 280 l S',
  '95 460 m 1095 460 l S',
  '155 645 m 720 645 l S',
  '420 135 m 1035 135 l S',
  // Index hints
  'BT /F1 16 Tf 0.35 0.25 0.65 rg 125 68 Td (START) Tj ET',
  'BT /F1 16 Tf 0.06 0.55 0.38 rg 1005 702 Td (FINISH) Tj ET',
  'BT /F1 20 Tf 0.15 0.20 0.30 rg 40 755 Td (ROBOLAB STUDIO - TRACK 2: PEREMPATAN & MAZE SOLVING PLAN) Tj ET',
].join('\n');

// 3. Track Lomba Pro (With Inverse White-on-Black Zone)
const streamPro = [
  '1 1 1 rg',
  `0 0 ${W} ${H} re f`,
  // Inverse Black Zone on top-right
  '0.06 0.07 0.10 rg',
  '660 430 460 280 re f',
  // Start Box
  '0.85 0.80 0.98 rg 100 95 90 90 re f',
  // Finish Box
  '0.72 0.95 0.85 rg 990 120 90 90 re f',
  // Main Black Track on White Floor
  '0.05 0.05 0.08 RG 18 w 1 J 1 j',
  '145 140 m 145 640 l 380 640 l 380 240 l 560 240 l 560 570 l 660 570 l S',
  // Intersection markers for Index triggers
  '85 360 m 205 360 l S',
  '85 520 m 205 520 l S',
  '320 440 m 440 440 l S',
  '500 390 m 620 390 l S',
  // White Track inside Black Zone
  '1 1 1 RG 18 w 1 J 1 j',
  '660 570 m 1035 570 l 1035 430 l S',
  '780 510 m 780 630 l S',
  '920 510 m 920 630 l S',
  // Exit from Black Zone back to White Floor to Finish
  '0.05 0.05 0.08 RG 18 w',
  '1035 430 m 1035 165 l S',
  '975 300 m 1095 300 l S',
  // Labels
  'BT /F1 16 Tf 0.35 0.25 0.65 rg 115 72 Td (START) Tj ET',
  'BT /F1 16 Tf 0.06 0.55 0.38 rg 1005 95 Td (FINISH) Tj ET',
  'BT /F1 15 Tf 0.95 0.95 1 rg 685 680 Td (ZONA GARIS PUTIH / INVERSE LINE) Tj ET',
  'BT /F1 20 Tf 0.15 0.20 0.30 rg 40 755 Td (ROBOLAB STUDIO - TRACK 3: KOMPETISI PRO + ZONA GARIS HITAM/PUTIH) Tj ET',
].join('\n');

const outDir = path.join(__dirname, '..', 'public', 'tracks');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'track-basic-oval.pdf'), buildSimplePdf(W, H, streamOval));
fs.writeFileSync(path.join(outDir, 'track-perempatan-maze.pdf'), buildSimplePdf(W, H, streamMaze));
fs.writeFileSync(path.join(outDir, 'track-lomba-pro.pdf'), buildSimplePdf(W, H, streamPro));

console.log('Generated 3 sample PDF tracks in public/tracks/');
