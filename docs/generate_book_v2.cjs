// generate_book_v2.cjs - Compiles 26-page HTML and generates high-res PDF
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pagesV2, renderPageV2 } = require('./book_v2_pages.cjs');

console.log("⚡ Building RoboLab Studio IoT Learning Book v2 (26 Pages)...");

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
  font-size: 11px;
  line-height: 1.38;
}

.page {
  width: 210mm;
  height: 297mm;
  max-height: 297mm;
  page-break-after: always;
  page-break-inside: avoid;
  position: relative;
  overflow: hidden;
  padding: 10mm 14mm 10mm 14mm;
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

/* Header & Footer */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #E2E8F0;
  padding-bottom: 5px;
  margin-bottom: 6px;
}
.header-badge {
  font-size: 8.5px;
  font-weight: 800;
  color: #0284C7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #E0F2FE;
  padding: 2.5px 8px;
  border-radius: 999px;
}
.header-chapter {
  font-family: 'Fredoka', sans-serif;
  font-size: 11.5px;
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
  padding-top: 5px;
  margin-top: 6px;
  font-size: 8.5px;
  color: #64748B;
}

/* Typography */
h1, h2, h3, h4 {
  font-family: 'Fredoka', sans-serif;
  margin: 0;
}
.subheading {
  font-size: 12.5px;
  color: #0F172A;
  margin: 6px 0 3px 0;
}
.text-sm {
  font-size: 10.5px;
  color: #334155;
  margin: 0 0 5px 0;
  line-height: 1.4;
}
.text-xs {
  font-size: 9.5px;
  line-height: 1.35;
}

/* Layouts */
.two-col-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  align-items: start;
}
.highlight-card {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1.5px solid transparent;
}
.component-list-box {
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 9px;
  margin-top: 4px;
}
.component-list-box ul, .component-list-box ol {
  margin: 2px 0 0 0;
  padding-left: 14px;
  color: #475569;
}

/* Blockly Visual Block Styles */
.blockly-c-block {
  border-radius: 6px;
  color: white;
  font-family: 'Fredoka', sans-serif;
  font-size: 10px;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  margin-bottom: 3px;
  display: inline-block;
  width: 100%;
}
.blockly-header {
  padding: 4px 6px;
  border-radius: 6px 6px 0 0;
  display: flex;
  align-items: center;
  gap: 5px;
}
.blockly-body {
  border-left: 12px solid rgba(0,0,0,0.15);
  padding: 4px 5px 4px 6px;
  background: rgba(0,0,0,0.06);
  min-height: 20px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.blockly-footer {
  padding: 2.5px 6px;
  border-radius: 0 0 6px 6px;
  font-size: 10px;
  font-weight: 700;
}
.blockly-stmt {
  padding: 3px 6px;
  border-radius: 4px;
  color: white;
  font-family: 'Fredoka', sans-serif;
  font-size: 9.5px;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
}
.pill-input {
  background: white;
  color: #1E293B;
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 9px;
  font-weight: 700;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.18);
  display: inline-flex;
  align-items: center;
}
.pill-reporter {
  border-radius: 999px;
  padding: 1.5px 6px;
  color: white;
  font-size: 9px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.12);
}
.block-preview-box {
  background: #F1F5F9;
  border: 1.5px solid #CBD5E1;
  border-radius: 6px;
  padding: 6px;
  margin-bottom: 4px;
}
.code-box-mini {
  background: #0F172A;
  border-radius: 5px;
  padding: 4px 6px;
  color: #38BDF8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  margin-top: 3px;
}
.code-box-mini .code-box-title {
  color: #94A3B8;
  font-size: 7.5px;
  font-family: sans-serif;
  font-weight: bold;
  margin-bottom: 2px;
}
.code-box-mini pre {
  margin: 0;
  line-height: 1.3;
}

/* Tips Box (RoboBot) */
.tips-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F0F9FF;
  border: 1.5px solid #BAE6FD;
  border-radius: 6px;
  padding: 5px 8px;
  margin-top: 5px;
}
.tips-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 10px;
  font-weight: 700;
  color: #0369A1;
  margin-bottom: 1px;
}
.tips-text {
  font-size: 8.5px;
  color: #0C4A6E;
  line-height: 1.3;
}

/* Cover Page Specific Styles */
.page-cover {
  background: linear-gradient(170deg, #F0F9FF 0%, #FFFFFF 40%, #EFF6FF 100%);
  padding: 12mm 15mm;
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
  font-size: 10px;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 999px;
  width: fit-content;
  box-shadow: 0 3px 8px rgba(2, 132, 199, 0.25);
}
.cover-title-group {
  margin-top: 4px;
}
.cover-pretitle {
  font-size: 10.5px;
  font-weight: 800;
  color: #0284C7;
  letter-spacing: 1.5px;
  margin-bottom: 2px;
}
.cover-main-title {
  font-size: 26px;
  line-height: 1.15;
  color: #0F172A;
  margin-bottom: 4px;
}
.highlight-text {
  background: linear-gradient(120deg, #0284C7, #06B6D4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.cover-subtitle {
  font-size: 10.5px;
  color: #475569;
  line-height: 1.35;
  max-width: 580px;
}
.cover-real-boards-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 0;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  margin: 6px 0;
}
.real-board-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.real-board-caption {
  font-size: 8.5px;
  font-weight: 800;
  color: #475569;
  background: white;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #CBD5E1;
}
.cover-features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 6px;
}
.feat-card {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 6px;
  padding: 6px;
  text-align: center;
}
.feat-icon {
  font-size: 10px;
  font-weight: bold;
  color: #0284C7;
  margin-bottom: 2px;
}
.feat-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 10px;
  font-weight: 700;
  color: #0F172A;
  margin-bottom: 1px;
}
.feat-desc {
  font-size: 8px;
  color: #64748B;
  line-height: 1.25;
}
.cover-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1.5px solid #E2E8F0;
  padding-top: 5px;
  font-size: 9px;
  color: #64748B;
}
.cover-platform-pill {
  background: #F1F5F9;
  border: 1px solid #CBD5E1;
  border-radius: 999px;
  padding: 2px 8px;
  font-weight: 700;
  color: #334155;
}

/* Curriculum Roadmap (Page 2) */
.curriculum-roadmap {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin: 4px 0;
}
.curr-module {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1.5px solid #E2E8F0;
  border-left-width: 4px;
  border-radius: 6px;
  padding: 4px 8px;
}
.curr-badge {
  font-size: 8px;
  font-weight: 800;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}
.curr-body {
  display: flex;
  flex-direction: column;
}
.curr-body strong {
  font-size: 10px;
  color: #0F172A;
}
.curr-body span {
  font-size: 8.5px;
  color: #64748B;
}

/* Feature Item Card (Page 3) */
.feature-item-card {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 6px;
  padding: 6px;
}
.feat-item-header {
  font-family: 'Fredoka', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #0F172A;
  margin-bottom: 3px;
}

/* Anatomy Grid (Page 4) */
.anatomy-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.anatomy-card {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 6px;
  padding: 6px;
}
.anatomy-header {
  font-family: 'Fredoka', sans-serif;
  font-size: 10.5px;
  font-weight: 700;
  color: #0F172A;
  margin-bottom: 2px;
}

/* Project Header Bar */
.project-header-bar {
  border-radius: 6px;
  padding: 6px 10px;
  color: white;
  margin-bottom: 4px;
}
.project-tag {
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.5px;
  opacity: 0.9;
}
.project-title {
  font-size: 14.5px;
  margin: 1px 0;
}
.project-goal {
  font-size: 9.5px;
  opacity: 0.95;
}

/* Comparison Grid (Page 8) */
.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 4px 0;
}
.comp-card {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 6px;
  padding: 6px;
}
.comp-badge {
  font-size: 8px;
  font-weight: 800;
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  display: inline-block;
}

/* Pin Categories */
.pin-category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pin-cat-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.pin-tag {
  color: white;
  font-size: 8px;
  font-weight: 800;
  padding: 1.5px 5px;
  border-radius: 3px;
  width: fit-content;
}
.pin-cat-desc {
  font-size: 9px;
  color: #475569;
  line-height: 1.3;
}

/* Three Rules Grid (Page 7) */
.three-rule-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  margin-top: 4px;
}
.rule-box {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 6px;
  padding: 5px;
}

/* Scale Table */
.scale-table {
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 5px;
  padding: 4px 6px;
}
.scale-header {
  font-size: 8.5px;
  font-weight: bold;
  margin-bottom: 2px;
}
.scale-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  font-size: 8px;
  padding: 2px 0;
  border-bottom: 1px dashed #E2E8F0;
}

/* Blynk Blocks Grid */
.blynk-blocks-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.blynk-card {
  background: white;
  border: 1.5px solid #E2E8F0;
  border-left: 3px solid #22C55E;
  border-radius: 5px;
  padding: 4px 6px;
}
.blynk-card-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 9.5px;
  font-weight: 700;
  color: #15803D;
}

/* IoT Pillars */
.pillar-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #F0FDF4;
  border: 1.5px solid #BBF7D0;
  border-radius: 5px;
  padding: 4px 6px;
}
.pillar-num {
  width: 18px;
  height: 18px;
  background: #22C55E;
  color: white;
  border-radius: 999px;
  font-family: 'Fredoka', sans-serif;
  font-weight: 700;
  font-size: 9.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pillar-text {
  font-size: 9px;
  color: #14532D;
}

/* Troubleshooting Grid */
.trouble-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.trouble-card {
  background: white;
  border: 1.5px solid #FEE2E2;
  border-left: 3px solid #EF4444;
  border-radius: 5px;
  padding: 4px 6px;
}
.trouble-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 9.5px;
  font-weight: 700;
  color: #991B1B;
  margin-bottom: 1px;
}
.trouble-body {
  font-size: 8.5px;
  color: #475569;
  line-height: 1.3;
}

/* Certificate Styles */
.cert-outer-frame {
  border: 4px double #0284C7;
  border-radius: 10px;
  padding: 5px;
  background: #F0F9FF;
}
.cert-inner-frame {
  border: 1.5px dashed #38BDF8;
  border-radius: 6px;
  padding: 8px;
  background: white;
  text-align: center;
}
.cert-org {
  font-weight: 800;
  color: #0284C7;
}
.cert-title {
  color: #0F172A;
}
.cert-subtitle {
  font-weight: 700;
  color: #64748B;
  letter-spacing: 0.5px;
}
.name-dots {
  color: #94A3B8;
  font-size: 12px;
  letter-spacing: 2px;
}
.name-label {
  font-size: 8px;
  color: #64748B;
  font-style: italic;
}
.cert-badges-row {
  display: flex;
  justify-content: center;
}
.cert-pill {
  background: #E0F2FE;
  color: #0369A1;
  font-size: 8px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid #BAE6FD;
}
.cert-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cert-sign-col {
  text-align: center;
  font-size: 8px;
  color: #475569;
}
.cert-date-line {
  font-weight: bold;
  margin-bottom: 2px;
}
.cert-stamp {
  width: 44px;
  height: 44px;
  border: 2px solid #EF4444;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-10deg);
}
.stamp-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #EF4444;
  font-size: 6.5px;
  font-weight: 800;
  line-height: 1.05;
}
.glossary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.gloss-item {
  background: white;
  border: 1px solid #EDE9FE;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}
.gloss-term {
  font-family: 'Fredoka', sans-serif;
  font-weight: 700;
  color: #6D28D9;
}
.gloss-def {
  color: #475569;
  line-height: 1.25;
}
`;

const renderedPagesHtml = pagesV2.map(p => renderPageV2(p.num, p.html, p.tag, p.title)).join('\n');

const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buku Panduan Dasar IoT & Robotika - RoboLab Studio</title>
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
