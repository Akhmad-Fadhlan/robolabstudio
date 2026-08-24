const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');

// 1. Remove the buggy display: none on flyout
css = css.replace(/html body \.blocklyFlyout \{\s*display: none !important;\s*\}/g, '');

// 2. Append the new toolbox tree icon styles
const treeStyles = `
/* SCRATCH-STYLE TOOLBOX CATEGORIES */
.blocklyTreeRow {
  padding: 6px 12px !important;
  margin: 6px 8px !important;
  border-radius: 12px !important;
  display: flex !important;
  align-items: center !important;
  transition: all 0.2s ease !important;
  border: 1px solid transparent !important;
}

/* Transform the tall rectangular icon into a cute circular bubble */
.blocklyTreeIcon {
  border-radius: 50% !important;
  width: 14px !important;
  height: 14px !important;
  min-width: 14px !important;
  min-height: 14px !important;
  margin-right: 10px !important;
  display: inline-block !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.3) !important;
  opacity: 0.9 !important;
  transform: none !important; /* disable previous scale */
}

/* Hover & Selected States */
.blocklyTreeRow:hover {
  background-color: rgba(120, 130, 150, 0.1) !important;
  transform: translateX(2px) !important;
}
.theme-light .blocklyTreeRow:hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}

.blocklyTreeSelected {
  background-color: rgba(120, 130, 150, 0.15) !important;
  box-shadow: inset 2px 0 0 var(--accent-primary, #6366f1) !important;
  border: 1px solid rgba(120, 130, 150, 0.1) !important;
}
.theme-light .blocklyTreeSelected {
  background-color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05), inset 3px 0 0 var(--accent-primary, #6366f1) !important;
  border: 1px solid rgba(0,0,0,0.04) !important;
}
.blocklyTreeSelected .blocklyTreeIcon {
  opacity: 1 !important;
  box-shadow: 0 0 8px currentColor, inset 0 1px 2px rgba(255,255,255,0.4) !important;
}

/* Labels */
.blocklyTreeLabel {
  font-family: 'Inter', 'Outfit', sans-serif !important;
  font-size: 13.5px !important;
  font-weight: 600 !important;
  letter-spacing: 0.01em !important;
  color: #e2e8f0 !important;
}
.theme-light .blocklyTreeLabel {
  color: #475569 !important;
}
.blocklyTreeSelected .blocklyTreeLabel {
  color: #ffffff !important;
}
.theme-light .blocklyTreeSelected .blocklyTreeLabel {
  color: #0f172a !important;
}

/* Hide annoying pink lines or default borders from Blockly */
.blocklyToolboxDiv {
  border-right: none !important;
  box-shadow: 4px 0 24px rgba(0,0,0,0.15) !important;
}
.theme-light .blocklyToolboxDiv {
  border-right: 1px solid rgba(0,0,0,0.04) !important;
  box-shadow: 2px 0 12px rgba(0,0,0,0.03) !important;
}
.blocklyFlyout {
  border: none !important;
}
`;

fs.writeFileSync('src/index.css', css + '\n' + treeStyles);
console.log('Fixed blockly flyout and styled category tree.');
