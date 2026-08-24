const fs = require('fs');

const finalFix = `
/* ULTRA SPECIFIC SCRATCH STYLE FOR BLOCKLY TOOLBOX */
html body #root .blocklyToolboxDiv {
  padding: 8px !important;
  background-color: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(20px) !important;
  border-right: 1px solid rgba(0,0,0,0.05) !important;
  box-shadow: 4px 0 24px rgba(0,0,0,0.05) !important;
}
html body.dark #root .blocklyToolboxDiv {
  background-color: rgba(13, 16, 27, 0.8) !important;
  border-right: 1px solid rgba(255,255,255,0.05) !important;
}

/* Redesign the Row itself to be a Bubble ! */
html body #root .blocklyTreeRow {
  margin: 6px 0 !important;
  padding: 8px 12px !important;
  border-radius: 20px !important; /* Fully rounded bubble */
  background-color: transparent !important;
  
  /* We use border-left as the Bubble Color */
  border-left-width: 16px !important; 
  border-left-style: solid !important;
  border-top: 1px solid transparent !important;
  border-right: 1px solid transparent !important;
  border-bottom: 1px solid transparent !important;
  
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease !important;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05) !important;
}

html body #root .blocklyTreeRow:hover {
  background-color: rgba(0,0,0,0.04) !important;
  transform: translateX(4px) scale(1.02) !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
}
html body.dark #root .blocklyTreeRow:hover {
  background-color: rgba(255,255,255,0.05) !important;
}

html body #root .blocklyTreeSelected {
  background-color: rgba(0,0,0,0.06) !important;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05) !important;
  transform: translateX(6px) scale(1.05) !important;
}
html body.dark #root .blocklyTreeSelected {
  background-color: rgba(255,255,255,0.1) !important;
}

html body #root .blocklyTreeLabel {
  font-family: 'Inter', sans-serif !important;
  font-size: 13.5px !important;
  font-weight: 600 !important;
  color: #334155 !important;
  padding-left: 10px !important;
}
html body.dark #root .blocklyTreeLabel {
  color: #cbd5e1 !important;
}
html body #root .blocklyTreeSelected .blocklyTreeLabel {
  color: #0f172a !important;
  font-weight: 700 !important;
}
html body.dark #root .blocklyTreeSelected .blocklyTreeLabel {
  color: #ffffff !important;
}

/* Hide default icons/empty spans */
html body #root .blocklyTreeIcon {
  display: none !important;
}
`;

fs.appendFileSync('src/index.css', finalFix);
console.log('Appended ultra specific fixes');
