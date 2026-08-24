const fs = require('fs');
let content = fs.readFileSync('src/components/Simulator.tsx', 'utf-8');

// 1. Remove the old Header and old SVG wrapper that got duplicated
const startIndex = content.indexOf('<div className="flex flex-col gap-2 border-b border-slate-800 pb-2.5 mb-2 flex-shrink-0">');
const endIndex = content.indexOf('{/* Static grid background (no zoom) */}');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
}

// 2. Remove the old telemtry stuff at the end
const oldFooterStart = content.indexOf('{/* 3. Connection Feedback Status Cards */}');
const lastDivIndex = content.lastIndexOf('</div>\n  );\n};');
if (oldFooterStart !== -1 && lastDivIndex !== -1) {
  content = content.substring(0, oldFooterStart) + content.substring(lastDivIndex);
}

fs.writeFileSync('src/components/Simulator.tsx', content);
console.log('Fixed Simulator.tsx');
