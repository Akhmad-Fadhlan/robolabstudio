// book_blocks.cjs - Visual Block & Component Builders for RoboLab Studio Book
const { mascotSVG } = require('./book_assets.cjs');

function pillInput(value, isDropdown = false) {
  return `<span class="pill-input">${value}${isDropdown ? ' <span style="font-size:8px; opacity:0.7;">▼</span>' : ''}</span>`;
}

function reporterPill(color, content) {
  return `<span class="pill-reporter" style="background:${color};">${content}</span>`;
}

function stmtBlock(color, content, icon = '') {
  return `
    <div class="blockly-stmt" style="background:${color};">
      ${icon ? `<span class="block-icon">${icon}</span>` : ''}
      <span>${content}</span>
    </div>
  `;
}

function cBlock(color, headerText, innerBlocksHtml, footerText = '}', icon = '') {
  return `
    <div class="blockly-c-block" style="background:${color};">
      <div class="blockly-header" style="background:${color};">
        ${icon ? `<span class="block-icon">${icon}</span>` : ''}
        <span>${headerText}</span>
      </div>
      <div class="blockly-body">
        ${innerBlocksHtml}
      </div>
      <div class="blockly-footer" style="background:${color};">
        <span>${footerText}</span>
      </div>
    </div>
  `;
}

function tipsBox(emotion, title, content) {
  return `
    <div class="tips-box">
      ${mascotSVG(emotion, 54)}
      <div class="tips-content">
        <div class="tips-title">${title}</div>
        <div class="tips-text">${content}</div>
      </div>
    </div>
  `;
}

function pageHeader(chapterNum, chapterTitle) {
  return `
    <div class="page-header">
      <div class="header-badge">RoboLab Studio • Edisi Belajar Mandiri</div>
      <div class="header-chapter">${chapterNum ? `BAB ${chapterNum}: ` : ''}${chapterTitle}</div>
    </div>
  `;
}

function pageFooter(pageNum, totalPages = 20) {
  return `
    <div class="page-footer">
      <div class="footer-left">🤖 Petualangan IoT & Robotika Cilik Bersama RoboLab Studio</div>
      <div class="footer-right">Halaman <strong>${pageNum}</strong> dari ${totalPages}</div>
    </div>
  `;
}

module.exports = {
  pillInput,
  reporterPill,
  stmtBlock,
  cBlock,
  tipsBox,
  pageHeader,
  pageFooter
};
