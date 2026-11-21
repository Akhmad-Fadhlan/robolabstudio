// generate_book.cjs - Compiles HTML and renders PDF via Microsoft Edge Headless
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { pages, renderPage } = require('./book_pages.cjs');

console.log("⚡ Building RoboLab Studio IoT Learning Book HTML...");

const cssStyles = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

@page {
  size: A4 portrait;
  margin: 0;
}

* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
  color: #1E293B;
  background-color: #E2E8F0;
  font-size: 11.5px;
  line-height: 1.4;
}

.page {
  width: 210mm;
  height: 297mm;
  max-height: 297mm;
  page-break-after: always;
  page-break-inside: avoid;
  position: relative;
  overflow: hidden;
  padding: 12mm 15mm 12mm 15mm;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 0 auto 10px auto;
}

@media print {
  body {
    background: white;
  }
  .page {
    margin: 0;
    box-shadow: none;
  }
}

/* Page Header & Footer */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #E2E8F0;
  padding-bottom: 6px;
  margin-bottom: 8px;
}
.header-badge {
  font-size: 9.5px;
  font-weight: 800;
  color: #0284C7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #E0F2FE;
  padding: 3px 8px;
  border-radius: 999px;
}
.header-chapter {
  font-family: 'Fredoka', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #0F172A;
}

.page-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
}

.page-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1.5px solid #E2E8F0;
  padding-top: 6px;
  margin-top: 8px;
  font-size: 9.5px;
  color: #64748B;
}

/* Typography Helpers */
h1, h2, h3, h4 {
  font-family: 'Fredoka', sans-serif;
  margin: 0;
}
.subheading {
  font-size: 14px;
  color: #0F172A;
  margin: 8px 0 4px 0;
}
.text-sm {
  font-size: 11px;
  color: #334155;
  margin: 0 0 6px 0;
  line-height: 1.45;
}
.text-xs {
  font-size: 10px;
  line-height: 1.4;
}

/* Layout Helpers */
.two-col-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}
.highlight-card {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1.5px solid transparent;
}
.component-list-box {
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 10px;
  margin-top: 6px;
}
.component-list-box ul {
  margin: 3px 0 0 0;
  padding-left: 16px;
  color: #475569;
}
.component-list-box li {
  margin-bottom: 2px;
}

/* Visual Block Styles (Blockly Style) */
.blockly-c-block {
  border-radius: 8px;
  color: white;
  font-family: 'Fredoka', sans-serif;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(0,0,0,0.12);
  margin-bottom: 4px;
  display: inline-block;
  width: 100%;
}
.blockly-header {
  padding: 5px 8px;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.blockly-body {
  border-left: 14px solid rgba(0,0,0,0.15);
  padding: 5px 6px 5px 8px;
  background: rgba(0,0,0,0.06);
  min-height: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.blockly-footer {
  padding: 3px 8px;
  border-radius: 0 0 8px 8px;
  font-size: 11px;
  font-weight: 700;
}
.blockly-stmt {
  padding: 4px 8px;
  border-radius: 5px;
  color: white;
  font-family: 'Fredoka', sans-serif;
  font-size: 10.5px;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
}
.pill-input {
  background: white;
  color: #1E293B;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
  display: inline-flex;
  align-items: center;
}
.pill-reporter {
  border-radius: 999px;
  padding: 2px 7px;
  color: white;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.block-preview-box {
  background: #F1F5F9;
  border: 1.5px solid #CBD5E1;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 6px;
}
.code-box-mini {
  background: #0F172A;
  border-radius: 6px;
  padding: 6px 8px;
  color: #38BDF8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  margin-top: 4px;
}
.code-box-mini .code-box-title {
  color: #94A3B8;
  font-size: 8px;
  font-family: sans-serif;
  font-weight: bold;
  margin-bottom: 2px;
}
.code-box-mini pre {
  margin: 0;
  line-height: 1.35;
}

/* Tips Box (RoboBot) */
.tips-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #F0F9FF;
  border: 1.5px solid #BAE6FD;
  border-radius: 8px;
  padding: 6px 10px;
  margin-top: 6px;
}
.tips-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #0369A1;
  margin-bottom: 2px;
}
.tips-text {
  font-size: 9.5px;
  color: #0C4A6E;
  line-height: 1.35;
}

/* Cover Page Specific Styles */
.page-cover {
  background: linear-gradient(170deg, #F0F9FF 0%, #FFFFFF 40%, #EFF6FF 100%);
  padding: 16mm 18mm;
  justify-content: space-between;
}
.cover-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}
.cover-badge-top {
  display: inline-flex;
  align-items: center;
  background: #0284C7;
  color: white;
  font-size: 11px;
  font-weight: 800;
  padding: 6px 14px;
  border-radius: 999px;
  width: fit-content;
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);
}
.cover-title-group {
  margin-top: 8px;
}
.cover-pretitle {
  font-size: 12px;
  font-weight: 800;
  color: #0284C7;
  letter-spacing: 2px;
  margin-bottom: 4px;
}
.cover-main-title {
  font-size: 32px;
  line-height: 1.15;
  color: #0F172A;
  margin-bottom: 8px;
}
.highlight-text {
  background: linear-gradient(120deg, #0284C7, #06B6D4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.cover-subtitle {
  font-size: 13px;
  color: #475569;
  line-height: 1.45;
  max-width: 580px;
}
.cover-hero-illustration {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0;
  min-height: 170px;
}
.cover-puzzle-badges {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.puzzle-badge {
  position: absolute;
  color: white;
  font-family: 'Fredoka', sans-serif;
  font-weight: 700;
  font-size: 11px;
  padding: 5px 12px;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}
.cover-features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 8px;
}
.feat-card {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
.feat-icon {
  font-size: 18px;
  margin-bottom: 3px;
}
.feat-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #0F172A;
  margin-bottom: 2px;
}
.feat-desc {
  font-size: 9px;
  color: #64748B;
  line-height: 1.3;
}
.cover-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 2px solid #E2E8F0;
  padding-top: 8px;
  font-size: 10px;
  color: #64748B;
}
.cover-platform-pill {
  background: #F1F5F9;
  border: 1px solid #CBD5E1;
  border-radius: 999px;
  padding: 3px 10px;
  font-weight: 700;
  color: #334155;
}

/* Roadmap Grid */
.roadmap-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 6px 0;
}
.road-step {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1.5px solid #E2E8F0;
  border-left-width: 5px;
  border-radius: 8px;
  padding: 6px 8px;
}
.road-num {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  color: white;
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.road-info {
  display: flex;
  flex-direction: column;
}
.road-info strong {
  font-size: 11px;
  color: #0F172A;
}
.road-info span {
  font-size: 9px;
  color: #64748B;
}

/* Anatomy Grid (Page 3) */
.anatomy-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.anatomy-card {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  padding: 8px;
}
.anatomy-header {
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #0F172A;
  margin-bottom: 4px;
}

/* Comparison Grid (Page 4) */
.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 6px 0;
}
.comp-card {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  padding: 8px;
}
.comp-badge {
  font-size: 8.5px;
  font-weight: 800;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  letter-spacing: 0.5px;
}

/* Board Grid (Page 5) */
.board-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 6px 0;
}
.board-card {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  padding: 8px;
}
.board-badge {
  font-size: 8.5px;
  font-weight: 800;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}
.board-name {
  font-size: 14px;
  color: #0F172A;
  margin: 4px 0 2px 0;
}
.board-desc {
  font-size: 9.5px;
  color: #64748B;
  margin: 0 0 6px 0;
  line-height: 1.35;
}
.board-specs {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 8.5px;
  color: #475569;
  background: #F8FAFC;
  padding: 4px 6px;
  border-radius: 4px;
}

/* Pin Category List (Page 6) */
.pin-category-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pin-cat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pin-tag {
  color: white;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}
.pin-cat-desc {
  font-size: 10px;
  color: #475569;
  line-height: 1.35;
}

/* Matrix Grid (Page 7) */
.matrix-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.matrix-card {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  padding: 8px;
}
.matrix-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.matrix-type {
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #0F172A;
}
.matrix-pill {
  color: white;
  font-size: 8.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 999px;
}
.matrix-desc {
  font-size: 10px;
  color: #475569;
  margin: 0 0 4px 0;
}
.matrix-examples {
  font-size: 9px;
  color: #64748B;
  background: #F8FAFC;
  padding: 4px 6px;
  border-radius: 4px;
  margin-bottom: 6px;
}
.matrix-block-wrap {
  display: flex;
  justify-content: center;
}

/* Project Header Bar */
.project-header-bar {
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  margin-bottom: 4px;
}
.project-tag {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5px;
  opacity: 0.9;
}
.project-title {
  font-size: 17px;
  margin: 2px 0;
}
.project-goal {
  font-size: 10.5px;
  opacity: 0.95;
}

/* Scale Table (Page 12) */
.scale-table {
  background: #FDF4FF;
  border: 1.5px solid #F0ABFC;
  border-radius: 6px;
  padding: 6px 8px;
}
.scale-header {
  font-size: 9.5px;
  font-weight: bold;
  color: #A21CAF;
  margin-bottom: 4px;
}
.scale-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  font-size: 9px;
  color: #701A75;
  padding: 2px 0;
  border-bottom: 1px dashed #F5D0FE;
}

/* IoT Pillars (Page 15) */
.iot-pillars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pillar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F0FDF4;
  border: 1.5px solid #BBF7D0;
  border-radius: 6px;
  padding: 6px 8px;
}
.pillar-num {
  width: 22px;
  height: 22px;
  background: #22C55E;
  color: white;
  border-radius: 999px;
  font-family: 'Fredoka', sans-serif;
  font-weight: 700;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pillar-text {
  font-size: 10px;
  color: #14532D;
}

/* Blynk Blocks Grid (Page 16) */
.blynk-blocks-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.blynk-card {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-left: 4px solid #22C55E;
  border-radius: 6px;
  padding: 6px 8px;
}
.blynk-card-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #15803D;
}
.block-wrap-sm {
  margin-top: 4px;
}

/* Troubleshooting Grid (Page 18) */
.trouble-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.trouble-card {
  background: white;
  border: 1.5px solid #FEE2E2;
  border-left: 4px solid #EF4444;
  border-radius: 6px;
  padding: 6px 8px;
}
.trouble-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #991B1B;
  margin-bottom: 2px;
}
.trouble-body {
  font-size: 9.5px;
  color: #475569;
  line-height: 1.35;
}

/* Glossary Grid (Page 19) */
.glossary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.gloss-item {
  background: white;
  border: 1.5px solid #EDE9FE;
  border-radius: 6px;
  padding: 5px 8px;
  display: flex;
  flex-direction: column;
}
.gloss-term {
  font-family: 'Fredoka', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #6D28D9;
}
.gloss-def {
  font-size: 9px;
  color: #475569;
  line-height: 1.3;
}

/* Certificate Styles (Page 20) */
.cert-outer-frame {
  border: 6px double #0284C7;
  border-radius: 12px;
  padding: 8px;
  background: #F0F9FF;
  margin-bottom: 8px;
}
.cert-inner-frame {
  border: 2px dashed #38BDF8;
  border-radius: 8px;
  padding: 12px;
  background: white;
  text-align: center;
}
.cert-org {
  font-size: 10px;
  font-weight: 800;
  color: #0284C7;
  letter-spacing: 1px;
  margin-top: 4px;
}
.cert-title {
  font-size: 26px;
  color: #0F172A;
  margin: 4px 0;
}
.cert-subtitle {
  font-size: 9.5px;
  font-weight: 700;
  color: #64748B;
  letter-spacing: 1px;
}
.cert-name-line {
  margin: 12px 0;
}
.name-dots {
  color: #94A3B8;
  font-size: 14px;
  letter-spacing: 2px;
}
.name-label {
  font-size: 9px;
  color: #64748B;
  font-style: italic;
  margin-top: 2px;
}
.cert-body-text {
  font-size: 10.5px;
  color: #334155;
  line-height: 1.45;
  max-width: 520px;
  margin: 0 auto 10px auto;
}
.cert-badges-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}
.cert-pill {
  background: #E0F2FE;
  color: #0369A1;
  font-size: 9.5px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid #BAE6FD;
}
.cert-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 16px;
}
.cert-sign-col {
  text-align: center;
  font-size: 9px;
  color: #475569;
}
.cert-date-line {
  font-weight: bold;
  margin-bottom: 4px;
}
.cert-stamp {
  width: 55px;
  height: 55px;
  border: 2px solid #EF4444;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-12deg);
}
.stamp-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #EF4444;
  font-size: 7.5px;
  font-weight: 800;
  line-height: 1.1;
}
.challenge-footer-box {
  background: #FEF3C7;
  border: 1.5px solid #FCD34D;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 9.5px;
  color: #92400E;
  line-height: 1.35;
}
`;

const renderedPagesHtml = pages.map(p => renderPage(p.num, p.html, p.chNum, p.chTitle)).join('\n');

const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buku Panduan Belajar IoT & Robotika - RoboLab Studio</title>
  <style>
    ${cssStyles}
  </style>
</head>
<body>
  ${renderedPagesHtml}
</body>
</html>`;

const outHtmlPath = path.join(__dirname, 'Buku_Panduan_IoT_RoboLab_Studio.html');
const outPdfPath = path.join(__dirname, 'Buku_Panduan_IoT_RoboLab_Studio.pdf');

fs.writeFileSync(outHtmlPath, fullHtml, 'utf8');
console.log(`✅ HTML generated successfully: ${outHtmlPath}`);

console.log("⚡ Compiling to PDF via Microsoft Edge Headless...");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const fileUri = "file:///" + outHtmlPath.replace(/\\/g, '/');

try {
  const { execFileSync } = require('child_process');
  execFileSync(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--run-all-compositor-stages-before-draw',
    '--no-pdf-header-footer',
    `--print-to-pdf=${outPdfPath}`,
    fileUri
  ], { stdio: 'inherit' });

  if (fs.existsSync(outPdfPath)) {
    const stats = fs.statSync(outPdfPath);
    console.log(`🎉 PDF generated successfully! Size: ${stats.size} bytes (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`📍 PDF Location: ${outPdfPath}`);
  } else {
    console.error("❌ PDF file was not created.");
  }
} catch (err) {
  console.error("❌ Error compiling PDF:", err.message);
}
