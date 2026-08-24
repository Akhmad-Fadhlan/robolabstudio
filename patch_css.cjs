const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');

const missingBlock = `
.app-root.theme-light div[class*="bg-slate-800"][class*="rounded-full"] {
  background: rgba(0,0,0,0.08) !important;
}

/* ================================================================
   BLOCKLY TOOLBOX GLASSMORPHISM & 3D VIEW OVERRIDES
   ================================================================ */

/* 1. Global / Dark Mode Toolbox */
.blocklyToolboxDiv {
  background: rgba(13, 16, 27, 0.65) !important;
  backdrop-filter: blur(20px) saturate(160%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(160%) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.35) !important;
  padding: 12px 8px !important;
}

.blocklyTreeRow {
  border-radius: 10px !important;
  margin: 3px 0 !important;
  padding: 6px 10px !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: 1px solid transparent !important;
  cursor: pointer !important;
}

/* Hover effect: Subtle 3D lift */
.blocklyTreeRow:not(.blocklyTreeSelected):hover {
  background: rgba(255, 255, 255, 0.06) !important;
  transform: translateX(4px) scale(1.02) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
}

/* Selected Category: Glowing Accent, 3D Elevation */
.blocklyTreeSelected {
  background: rgba(99, 102, 241, 0.22) !important;
  border-color: rgba(99, 102, 241, 0.45) !important;
  transform: translateX(6px) scale(1.04) !important;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
}

.blocklyTreeSelected .blocklyTreeLabel {
  color: #a5b4fc !important;
  font-weight: 700 !important;
  text-shadow: 0 0 8px rgba(99, 102, 241, 0.5) !important;
}

/* 2. Light Mode Override: Ultra Premium Frosted Glass */
.app-root.theme-light .blocklyToolboxDiv {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(25px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(25px) saturate(180%) !important;
  border-right: 1px solid rgba(0, 0, 0, 0.04) !important;
  box-shadow: 3px 0 20px rgba(15, 23, 42, 0.03) !important;
}

.app-root.theme-light .blocklyToolboxDiv * {
  background-color: transparent !important;
}
`;

if (!css.includes('.blocklyToolboxDiv')) {
  css = css.replace(
    /.app-root.theme-light div\[class\*="bg-\[#0b0c10\]"\] span \{ color: #475569 !important; \}\n\}/g,
    `.app-root.theme-light div[class*="bg-[#0b0c10]"] span { color: #475569 !important; }\n}\n\n${missingBlock}`
  );

  fs.writeFileSync('src/index.css', css);
  console.log('Restored index.css missing blockly styles');
} else {
  console.log('Styles already exist!');
}
